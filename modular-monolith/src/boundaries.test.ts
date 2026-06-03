import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createInventoryModule } from "./modules/inventory/index.js";
import { createOrdersModule } from "./modules/orders/index.js";

// ── Functional test: cross-module call works via the public API ─────
test("orders reserves through inventory's public API", () => {
  const inventory = createInventoryModule();
  inventory.seed("WIDGET", 5);
  const orders = createOrdersModule(inventory);

  assert.equal(orders.place("WIDGET", 3).status, "placed");
  assert.equal(inventory.available("WIDGET"), 2);
  assert.equal(orders.place("WIDGET", 3).status, "rejected"); // only 2 left
});

// ── Architecture test: boundaries are ENFORCED, not just documented ──
// Scans module source and fails the build if any module imports another
// module's /internal/ path. This is the dependency-cruiser/ArchUnit idea
// in ~15 lines — the thing that stops a modular monolith from rotting.
function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

test("no module imports another module's internals", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "modules");
  const modules = readdirSync(root); // ["inventory", "orders"]
  const violations: string[] = [];

  for (const file of tsFiles(root)) {
    const owningModule = modules.find((m) => file.includes(join("modules", m)));
    const src = readFileSync(file, "utf-8");
    const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1] ?? "");
    for (const imp of imports) {
      // A forbidden import: references another module's internal folder.
      const other = modules.find((m) => m !== owningModule && imp.includes(`${m}/internal`));
      if (other) violations.push(`${file} imports ${other}'s internals: ${imp}`);
    }
  }

  assert.deepEqual(violations, [], `boundary violations:\n${violations.join("\n")}`);
});
