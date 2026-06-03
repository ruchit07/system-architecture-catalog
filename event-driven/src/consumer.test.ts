import { test } from "node:test";
import assert from "node:assert/strict";

import { InMemoryBroker } from "./broker.js";
import { PaymentConsumer } from "./consumer.js";
import type { Event } from "./types.js";

test("duplicate delivery charges exactly once (idempotency)", async () => {
  const broker = new InMemoryBroker();
  const consumer = new PaymentConsumer();
  const event: Event = { id: "evt-1", type: "OrderPlaced", payload: { orderId: "o1", amount: 100 } };

  // redeliver: true simulates the at-least-once duplicate
  await broker.publish(event, (e) => consumer.handle(e), { redeliver: true });

  assert.equal(consumer.charges.length, 1); // not 2 — this is the whole point
  assert.equal(broker.getDeadLetters().length, 0);
});

test("poison message lands in the dead-letter queue, not the charges", async () => {
  const broker = new InMemoryBroker(3);
  const consumer = new PaymentConsumer();
  const bad: Event = { id: "evt-2", type: "OrderPlaced", payload: null };

  await broker.publish(bad, (e) => consumer.handle(e));

  assert.equal(consumer.charges.length, 0);
  assert.equal(broker.getDeadLetters().length, 1);
  assert.equal(broker.getDeadLetters()[0]?.id, "evt-2");
});

test("unrelated event types are ignored", async () => {
  const broker = new InMemoryBroker();
  const consumer = new PaymentConsumer();
  const other: Event = { id: "evt-3", type: "UserSignedUp", payload: { email: "a@b.com" } };

  await broker.publish(other, (e) => consumer.handle(e));

  assert.equal(consumer.charges.length, 0);
  assert.equal(broker.getDeadLetters().length, 0);
});
