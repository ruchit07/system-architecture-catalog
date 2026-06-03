// The READ side (the "Query" in CQRS). Projections are denormalized read
// models built by subscribing to the event stream. Each is optimized for a
// different query and is independent — you can add a new one and rebuild it
// by replaying the log, without touching the write side.

import type { AccountEvent } from "./events.js";

/** Read model #1: current balance per account (optimized for "what's my balance?"). */
export class BalanceProjection {
  private readonly balances = new Map<string, number>();
  on(e: AccountEvent): void {
    const cur = this.balances.get(e.accountId) ?? 0;
    if (e.type === "MoneyDeposited") this.balances.set(e.accountId, cur + e.amountCents);
    else if (e.type === "MoneyWithdrawn") this.balances.set(e.accountId, cur - e.amountCents);
    else if (e.type === "AccountOpened") this.balances.set(e.accountId, 0);
  }
  balanceOf(accountId: string): number {
    return this.balances.get(accountId) ?? 0;
  }
}

/** Read model #2: transaction history (optimized for "show me a statement"). */
export class HistoryProjection {
  private readonly history = new Map<string, { kind: string; amountCents: number; at: string }[]>();
  on(e: AccountEvent): void {
    if (e.type === "AccountOpened") return;
    const list = this.history.get(e.accountId) ?? [];
    list.push({ kind: e.type, amountCents: e.amountCents, at: e.at });
    this.history.set(e.accountId, list);
  }
  statementFor(accountId: string) {
    return this.history.get(accountId) ?? [];
  }
}
