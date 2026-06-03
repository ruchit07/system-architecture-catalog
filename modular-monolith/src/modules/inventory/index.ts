// PUBLIC API of the inventory module — the only surface other modules may use.
// Internals (the store) stay private behind this narrow interface. Swap the
// store for a real database and consumers never notice.

import { InventoryStore } from "./internal/store.js";

export interface InventoryModule {
  seed(sku: string, qty: number): void;
  /** Returns true and reserves if available; false otherwise. */
  tryReserve(sku: string, qty: number): boolean;
  available(sku: string): number;
}

export function createInventoryModule(): InventoryModule {
  const store = new InventoryStore(); // owned data — private to this module
  return {
    seed(sku, qty) {
      store.set(sku, qty);
    },
    tryReserve(sku, qty) {
      const row = store.get(sku);
      if (!row || row.available < qty) return false;
      store.set(sku, row.available - qty);
      return true;
    },
    available(sku) {
      return store.get(sku)?.available ?? 0;
    },
  };
}
