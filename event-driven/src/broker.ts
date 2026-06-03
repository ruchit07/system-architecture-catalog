import type { Event, Handler } from "./types.js";

// A tiny in-memory broker that models the two facts about real brokers that
// trip teams up:
//
//   1. Delivery is AT-LEAST-ONCE — the same event can arrive more than once
//      (simulated here with the `redeliver` option).
//   2. Some events never succeed — after `maxAttempts` failures they must go
//      somewhere visible (the dead-letter queue) instead of being dropped or
//      retried forever.
//
// Real brokers (Kafka, SQS, RabbitMQ) give you these mechanics; this strips
// them to the essentials so the consumer-side patterns are legible.

export class InMemoryBroker {
  private readonly dlq: Event[] = [];

  constructor(private readonly maxAttempts = 3) {}

  /** Events that failed `maxAttempts` times — inspect/alert on these. */
  getDeadLetters(): Event[] {
    return [...this.dlq];
  }

  /**
   * Publish an event to a handler. Set `redeliver: true` to simulate the
   * at-least-once duplicate that real networks produce.
   */
  async publish(event: Event, handler: Handler, opts: { redeliver?: boolean } = {}): Promise<void> {
    await this.deliverWithRetries(event, handler);
    if (opts.redeliver) {
      await this.deliverWithRetries(event, handler); // the duplicate
    }
  }

  private async deliverWithRetries(event: Event, handler: Handler): Promise<void> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        await handler(event);
        return; // success
      } catch {
        if (attempt === this.maxAttempts) {
          this.dlq.push(event); // give up → dead-letter, don't drop or loop forever
        }
        // (a real broker would back off with jitter between attempts)
      }
    }
  }
}
