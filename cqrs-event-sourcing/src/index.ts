import { EventStore } from "./event-store.js";
import { BankAccount } from "./aggregate.js";
import { BalanceProjection, HistoryProjection } from "./projections.js";

const store = new EventStore();
const balances = new BalanceProjection();
const history = new HistoryProjection();
store.subscribe((e) => balances.on(e));
store.subscribe((e) => history.on(e));

const run = (id: string, fn: (a: BankAccount) => ReturnType<BankAccount["deposit"]>) =>
  store.append(fn(BankAccount.rehydrate(id, store.streamFor(id))));

run("acc-1", (a) => a.open("Ada"));
run("acc-1", (a) => a.deposit(10000));
run("acc-1", (a) => a.withdraw(2500));

console.log("balance (read model):", balances.balanceOf("acc-1"));
console.log("statement (read model):", history.statementFor("acc-1"));
console.log("rebuilt from log:", BankAccount.rehydrate("acc-1", store.streamFor("acc-1")).balance);
console.log("immutable event log:", store.all().map((e) => e.type));
