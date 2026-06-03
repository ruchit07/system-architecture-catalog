import { test } from "node:test";
import assert from "node:assert/strict";

import { buildOrderSaga, PaymentService, InventoryService, ShippingService } from "./order-saga.js";

test("happy path: all steps complete, nothing compensated", async () => {
  const payment = new PaymentService();
  const inventory = new InventoryService();
  const shipping = new ShippingService();
  const saga = buildOrderSaga(payment, inventory, shipping);

  const result = await saga.run({ orderId: "order-1" });

  assert.equal(result.ok, true);
  assert.deepEqual(result.completed, ["charge-payment", "reserve-inventory", "schedule-shipping"]);
  assert.equal(result.compensated.length, 0);
  assert.ok(payment.charged.has("order-1"));
  assert.ok(inventory.reserved.has("order-1"));
  assert.ok(shipping.scheduled.has("order-1"));
});

test("shipping fails: prior steps compensated in reverse, state rolled back", async () => {
  const payment = new PaymentService();
  const inventory = new InventoryService();
  const shipping = new ShippingService(true); // force failure on the last step
  const saga = buildOrderSaga(payment, inventory, shipping);

  const result = await saga.run({ orderId: "order-2" });

  assert.equal(result.ok, false);
  assert.equal(result.failedStep, "schedule-shipping");
  // completed before failure: payment, inventory — compensated in reverse:
  assert.deepEqual(result.compensated, ["reserve-inventory", "charge-payment"]);
  // critically: the side effects were rolled back, no partial order left behind
  assert.equal(payment.charged.has("order-2"), false); // refunded
  assert.equal(inventory.reserved.has("order-2"), false); // released
  assert.equal(shipping.scheduled.has("order-2"), false);
});

test("inventory fails: only payment compensated", async () => {
  const payment = new PaymentService();
  const inventory = new InventoryService(true); // fail on step 2
  const shipping = new ShippingService();
  const saga = buildOrderSaga(payment, inventory, shipping);

  const result = await saga.run({ orderId: "order-3" });

  assert.equal(result.ok, false);
  assert.equal(result.failedStep, "reserve-inventory");
  assert.deepEqual(result.compensated, ["charge-payment"]);
  assert.equal(payment.charged.has("order-3"), false); // refunded, customer made whole
});
