import { InMemoryBroker } from "./broker.js";
import { PaymentConsumer } from "./consumer.js";
import type { Event } from "./types.js";

async function main() {
  const broker = new InMemoryBroker();
  const consumer = new PaymentConsumer();

  // A normal order, redelivered once (the network hiccupped).
  const order: Event = { id: "evt-100", type: "OrderPlaced", payload: { orderId: "order-100", amount: 4200 } };
  await broker.publish(order, (e) => consumer.handle(e), { redeliver: true });

  // A malformed event that can never succeed.
  const poison: Event = { id: "evt-101", type: "OrderPlaced", payload: null };
  await broker.publish(poison, (e) => consumer.handle(e));

  console.log("charges (should be 1, despite the duplicate):", consumer.charges);
  console.log("dead letters (should contain evt-101):", broker.getDeadLetters().map((e) => e.id));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
