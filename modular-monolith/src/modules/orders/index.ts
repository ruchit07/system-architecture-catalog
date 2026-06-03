// PUBLIC API of the orders module. It depends on the inventory module ONLY
// through inventory's public interface (../inventory/index.js) — never its
// internals. In a single deployable, this is an in-process call; the boundary
// is real even though it isn't a network hop.

import { OrderStore } from "./internal/store.js";
import type { InventoryModule } from "../inventory/index.js";

export interface OrdersModule {
  place(sku: string, qty: number): { id: string; status: "placed" | "rejected" };
}

export function createOrdersModule(inventory: InventoryModule): OrdersModule {
  const store = new OrderStore();
  let seq = 0;
  return {
    place(sku, qty) {
      const id = `order-${++seq}`;
      // Cross-module call through the PUBLIC port only.
      const reserved = inventory.tryReserve(sku, qty);
      const status = reserved ? "placed" : "rejected";
      store.add({ id, sku, qty, status });
      return { id, status };
    },
  };
}
