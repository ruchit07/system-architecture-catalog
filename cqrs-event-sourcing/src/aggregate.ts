// The WRITE side (the "Command" in CQRS). The aggregate enforces invariants
// and emits events. State is reconstructed by FOLDING the event stream —
// `rehydrate` proves you can rebuild any aggregate from its log alone.

import type { AccountEvent } from "./events.js";

export class OverdraftError extends Error {}

export class BankAccount {
  private balanceCents = 0;
  private opened = false;

  constructor(public readonly accountId: string) {}

  /** Rebuild state from history — the core promise of event sourcing. */
  static rehydrate(accountId: string, history: AccountEvent[]): BankAccount {
    const acc = new BankAccount(accountId);
    for (const e of history) acc.apply(e);
    return acc;
  }

  get balance(): number {
    return this.balanceCents;
  }

  // ── Commands: validate invariants, return NEW events (don't store here) ──
  open(owner: string): AccountEvent[] {
    if (this.opened) throw new Error("already open");
    return [{ type: "AccountOpened", accountId: this.accountId, owner, at: new Date().toISOString() }];
  }

  deposit(amountCents: number): AccountEvent[] {
    if (amountCents <= 0) throw new Error("amount must be positive");
    return [{ type: "MoneyDeposited", accountId: this.accountId, amountCents, at: new Date().toISOString() }];
  }

  withdraw(amountCents: number): AccountEvent[] {
    if (amountCents <= 0) throw new Error("amount must be positive");
    if (amountCents > this.balanceCents) {
      throw new OverdraftError(`balance ${this.balanceCents} < withdrawal ${amountCents}`);
    }
    return [{ type: "MoneyWithdrawn", accountId: this.accountId, amountCents, at: new Date().toISOString() }];
  }

  // ── Apply: the fold that mutates in-memory state from an event ──
  apply(e: AccountEvent): void {
    switch (e.type) {
      case "AccountOpened":
        this.opened = true;
        break;
      case "MoneyDeposited":
        this.balanceCents += e.amountCents;
        break;
      case "MoneyWithdrawn":
        this.balanceCents -= e.amountCents;
        break;
    }
  }
}
