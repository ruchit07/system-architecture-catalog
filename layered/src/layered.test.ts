import { test } from "node:test";
import assert from "node:assert/strict";

import { ProductRepository } from "./data.js";
import { priceLine, InsufficientStockError } from "./domain.js";
import { OrderService } from "./service.js";
import { OrderController } from "./api.js";

const seed = () =>
  new ProductRepository([
    { sku: "WIDGET", name: "Widget", unitPriceCents: 1000, stock: 100 },
    { sku: "RARE", name: "Rare item", unitPriceCents: 5000, stock: 3 },
  ]);

// Domain layer is testable with ZERO infrastructure — the payoff of layering.
test("domain: bulk discount applies at qty >= 10", () => {
  const line = priceLine({ sku: "WIDGET", name: "", unitPriceCents: 1000, stock: 100 }, 10);
  assert.equal(line.discountCents, 1000); // 10% of 10*1000
  assert.equal(line.lineTotalCents, 9000);
});

test("domain: rejects orders beyond stock", () => {
  assert.throws(
    () => priceLine({ sku: "RARE", name: "", unitPriceCents: 5000, stock: 3 }, 4),
    InsufficientStockError,
  );
});

test("service: places an order and decrements stock", () => {
  const repo = seed();
  const result = new OrderService(repo).placeOrder([{ sku: "WIDGET", qty: 10 }]);
  assert.equal(result.totalCents, 9000);
  assert.equal(repo.findBySku("WIDGET")?.stock, 90);
});

test("api: maps domain errors to a 400", () => {
  const controller = new OrderController(new OrderService(seed()));
  const res = controller.createOrder({ items: [{ sku: "RARE", qty: 99 }] });
  assert.equal(res.status, 400);
});

test("api: returns 201 with a formatted total on success", () => {
  const controller = new OrderController(new OrderService(seed()));
  const res = controller.createOrder({ items: [{ sku: "WIDGET", qty: 2 }] });
  assert.equal(res.status, 201);
  assert.deepEqual((res.body as { total: number }).total, 20);
});
