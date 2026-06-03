// The functions. Each is a small, stateless handler — the unit of deployment
// and scaling in serverless. They're pure-ish: input event in, result out,
// side effects via the injected store/context. That purity is exactly what
// makes them trivial to unit-test in isolation (see functions.test.ts).

import type { FnContext } from "./runtime.js";

export interface OrderStore {
  saved: { id: string; sku: string }[];
  processed: string[];
}

export function makeStore(): OrderStore {
  return { saved: [], processed: [] };
}

// HTTP-triggered: validates, persists, emits a domain event. Returns an HTTP-ish result.
export function createOrder(store: OrderStore) {
  return (event: unknown, ctx: FnContext) => {
    const req = event as { sku?: string };
    if (!req?.sku) return { status: 400, body: { error: "sku required" } };
    const id = `order-${store.saved.length + 1}`;
    store.saved.push({ id, sku: req.sku });
    ctx.emit("OrderCreated", { id, sku: req.sku }); // fan-out to downstream functions
    return { status: 201, body: { id } };
  };
}

// Event-triggered: reacts to OrderCreated. Independent, scales on its own.
export function processOrder(store: OrderStore) {
  return (event: unknown) => {
    const { id } = event as { id: string };
    store.processed.push(id);
    return { ok: true };
  };
}

// Schedule-triggered: a nightly batch job. Same model, different trigger.
export function nightlyReport(store: OrderStore) {
  return () => ({ orders: store.saved.length, processed: store.processed.length });
}
