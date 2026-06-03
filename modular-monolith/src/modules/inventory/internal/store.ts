// INTERNAL to the inventory module. Other modules must NOT import this —
// they go through the module's public index.ts. The architecture test
// enforces that rule at build time.

export interface StockRow {
  sku: string;
  available: number;
}

export class InventoryStore {
  private readonly rows = new Map<string, StockRow>();
  set(sku: string, available: number) {
    this.rows.set(sku, { sku, available });
  }
  get(sku: string): StockRow | undefined {
    return this.rows.get(sku);
  }
}
