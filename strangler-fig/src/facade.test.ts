import { test } from "node:test";
import assert from "node:assert/strict";

import { RoutingFacade } from "./facade.js";
import { legacy, modern } from "./services.js";

function facade() {
  const f = new RoutingFacade();
  f.register("GET /user", legacy.getUser, modern.getUser);
  f.register("GET /orders", legacy.getOrders, modern.getOrders);
  return f;
}

test("unmigrated routes go to legacy by default", () => {
  const f = facade();
  assert.equal(f.handle("GET /user", { path: "/user" }).source, "legacy");
});

test("a fully migrated route goes to new; others stay legacy (one route at a time)", () => {
  const f = facade();
  f.setMode("GET /user", { kind: "new" });
  assert.equal(f.handle("GET /user", { path: "/user" }).source, "new");
  assert.equal(f.handle("GET /orders", { path: "/orders" }).source, "legacy");
});

test("canary splits traffic deterministically by the roll", () => {
  const f = facade();
  f.setMode("GET /user", { kind: "canary", percent: 0.5 });
  assert.equal(f.handle("GET /user", { path: "/user" }, 0.2).source, "new");    // 0.2 < 0.5
  assert.equal(f.handle("GET /user", { path: "/user" }, 0.9).source, "legacy"); // 0.9 >= 0.5
});

test("rollback instantly returns a route to legacy", () => {
  const f = facade();
  f.setMode("GET /user", { kind: "new" });
  f.rollback("GET /user");
  assert.equal(f.handle("GET /user", { path: "/user" }).source, "legacy");
});

test("metrics record where traffic went (data-driven cutover)", () => {
  const f = facade();
  f.setMode("GET /user", { kind: "canary", percent: 0.5 });
  f.handle("GET /user", { path: "/user" }, 0.1); // new
  f.handle("GET /user", { path: "/user" }, 0.2); // new
  f.handle("GET /user", { path: "/user" }, 0.8); // legacy
  assert.deepEqual(f.metrics.get("GET /user"), { legacy: 1, new: 2 });
});
