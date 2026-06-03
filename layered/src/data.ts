// ── Data Access Layer (bottom) ─────────────────────────────────────
// Knows about persistence ONLY. No business rules live here. Higher
// layers depend on this; this depends on nothing above it.

export interface Product {
  sku: string;
  name: string;
  unitPriceCents: number;
  stock: number;
}

export class ProductRepository {
  private readonly byScu = new Map<string, Product>();

  constructor(seed: Product[] = []) {
    for (const p of seed) this.byScu.set(p.sku, { ...p });
  }

  findBySku(sku: string): Product | null {
    const p = this.byScu.get(sku);
    return p ? { ...p } : null;
  }

  decrementStock(sku: string, qty: number): void {
    const p = this.byScu.get(sku);
    if (p) p.stock -= qty;
  }
}
