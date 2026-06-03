import { test } from "node:test";
import assert from "node:assert/strict";

import { EventStore } from "./event-store.js";
import { BankAccount, OverdraftError } from "./aggregate.js";
import { BalanceProjection, HistoryProjection } from "./projections.js";

function setup() {
  const store = new EventStore();
  const balances = new BalanceProjection();
  const history = new HistoryProjection();
  store.subscribe((e) => balances.on(e));
  store.subscribe((e) => history.on(e));
  return { store, balances, history };
}

// Helper: load aggregate from its stream, run a command, append resulting events.
function handle(store: EventStore, accountId: string, fn: (a: BankAccount) => ReturnType<BankAccount["deposit"]>) {
  const acc = BankAccount.rehydrate(accountId, store.streamFor(accountId));
  store.append(fn(acc));
}

test("write side enforces the no-overdraft invariant", () => {
  const { store } = setup();
  handle(store, "acc-1", (a) => a.open("Ada"));
  handle(store, "acc-1", (a) => a.deposit(5000));
  assert.throws(() => handle(store, "acc-1", (a) => a.withdraw(9000)), OverdraftError);
});

test("read models are built from the event stream (CQRS)", () => {
  const { store, balances, history } = setup();
  handle(store, "acc-1", (a) => a.open("Ada"));
  handle(store, "acc-1", (a) => a.deposit(5000));
  handle(store, "acc-1", (a) => a.withdraw(2000));

  assert.equal(balances.balanceOf("acc-1"), 3000);     // balance projection
  assert.equal(history.statementFor("acc-1").length, 2); // deposit + withdrawal
});

test("state can be fully rebuilt by replaying the log (event sourcing)", () => {
  const { store } = setup();
  handle(store, "acc-1", (a) => a.open("Ada"));
  handle(store, "acc-1", (a) => a.deposit(7000));
  handle(store, "acc-1", (a) => a.withdraw(1500));

  // Rebuild a brand-new aggregate purely from history — no stored balance.
  const rebuilt = BankAccount.rehydrate("acc-1", store.streamFor("acc-1"));
  assert.equal(rebuilt.balance, 5500);
});

test("a new projection can be added and rebuilt from history alone", () => {
  const { store } = setup();
  handle(store, "acc-1", (a) => a.open("Ada"));
  handle(store, "acc-1", (a) => a.deposit(1000));

  // Add a fresh projection AFTER the fact and replay the whole log into it.
  const lateBalance = new BalanceProjection();
  for (const e of store.all()) lateBalance.on(e);
  assert.equal(lateBalance.balanceOf("acc-1"), 1000);
});
