// Events are immutable facts, in the past tense. The event log is the
// source of truth; current state is a fold over these. This is what gives
// event sourcing its audit trail and time-travel — nothing is ever updated
// or deleted, only appended.

export type AccountEvent =
  | { type: "AccountOpened"; accountId: string; owner: string; at: string }
  | { type: "MoneyDeposited"; accountId: string; amountCents: number; at: string }
  | { type: "MoneyWithdrawn"; accountId: string; amountCents: number; at: string };
