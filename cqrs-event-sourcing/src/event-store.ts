// Append-only event store. In production this is a durable, ordered log
// (e.g., a Postgres events table or a dedicated event store). The only
// write operation is "append" — there is no update or delete.

import type { AccountEvent } from "./events.js";

export class EventStore {
  private readonly events: AccountEvent[] = [];
  private readonly subscribers: ((e: AccountEvent) => void)[] = [];

  append(newEvents: AccountEvent[]): void {
    for (const e of newEvents) {
      this.events.push(e);
      for (const sub of this.subscribers) sub(e); // feed projections
    }
  }

  /** Replay: the entire log, or just one aggregate's stream. */
  streamFor(accountId: string): AccountEvent[] {
    return this.events.filter((e) => e.accountId === accountId);
  }

  all(): AccountEvent[] {
    return [...this.events];
  }

  /** Projections subscribe to build read models as events are appended. */
  subscribe(handler: (e: AccountEvent) => void): void {
    this.subscribers.push(handler);
  }
}
