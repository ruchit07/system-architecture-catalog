import { test } from "node:test";
import assert from "node:assert/strict";

import { LocalRuntime, type FnContext } from "./runtime.js";
import { createOrder, processOrder, nightlyReport, makeStore } from "./functions.js";

// Serverless functions are pure-ish → unit-testable in ISOLATION, no platform.
test("createOrder validates input (handler in isolation)", () => {
  const noop: FnContext = { emit: () => {} };
  const result = createOrder(makeStore())({}, noop) as { status: number };
  assert.equal(result.status, 400);
});

test("createOrder persists and emits OrderCreated", () => {
  const store = makeStore();
  const emitted: string[] = [];
  const ctx: FnContext = { emit: (t) => emitted.push(t) };
  const result = createOrder(store)({ sku: "WIDGET" }, ctx) as { status: number };
  assert.equal(result.status, 201);
  assert.equal(store.saved.length, 1);
  assert.deepEqual(emitted, ["OrderCreated"]);
});

// Full pipeline via the local runtime: http → emits event → cascades to processOrder.
test("event pipeline cascades through the runtime", async () => {
  const store = makeStore();
  const rt = new LocalRuntime();
  rt.register("http:POST /orders", createOrder(store));
  rt.register("event:OrderCreated", processOrder(store));
  rt.register("schedule:nightly", nightlyReport(store));

  await rt.invoke("http:POST /orders", { sku: "WIDGET" });

  assert.equal(store.saved.length, 1);
  assert.equal(store.processed.length, 1); // processOrder ran via the cascade

  const report = await rt.invoke("schedule:nightly", {});
  assert.deepEqual(report, { orders: 1, processed: 1 });
});
