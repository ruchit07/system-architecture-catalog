import type { Event } from "./types.js";

interface OrderPlaced {
  orderId: string;
  amount: number;
}

// The payment consumer. The whole point of this file is two lines of defense:
//
//   - IDEMPOTENCY: it remembers which event IDs it has processed and skips
//     duplicates, so at-least-once redelivery can't double-charge a customer.
//   - It records the processed ID together with the side effect (here, in the
//     same in-memory step) — in a real system this is ONE database transaction,
//     so a crash in between can't break the guarantee.
//
// A malformed payload throws, which lets the broker exhaust retries and
// dead-letter the event rather than silently dropping it.

export class PaymentConsumer {
  private readonly processed = new Set<string>();
  public readonly charges: Array<{ orderId: string; amount: number }> = [];

  async handle(event: Event): Promise<void> {
    if (event.type !== "OrderPlaced") return;

    const payload = event.payload as OrderPlaced | null;
    if (!payload || typeof payload.amount !== "number") {
      throw new Error(`malformed OrderPlaced payload for event ${event.id}`);
    }

    if (this.processed.has(event.id)) {
      return; // duplicate — already charged for this event, do nothing
    }

    // Side effect + idempotency record happen together (one transaction in prod).
    this.charges.push({ orderId: payload.orderId, amount: payload.amount });
    this.processed.add(event.id);
  }
}
