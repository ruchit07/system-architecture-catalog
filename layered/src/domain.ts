// ── Domain Layer ───────────────────────────────────────────────────
// The actual business rules. Pure, no I/O, independently testable.
// This is the layer that rots first when teams let logic leak up into
// controllers or down into the database — keep it real and keep it here.

import type { Product } from "./data.js";

export interface PricedLine {
  sku: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  discountCents: number;
}

export class InsufficientStockError extends Error {}

/** Business rule: bulk discount — 10% off the line when qty >= 10. */
export function priceLine(product: Product, qty: number): PricedLine {
  if (qty <= 0) throw new Error("qty must be positive");
  if (qty > product.stock) {
    throw new InsufficientStockError(`only ${product.stock} of ${product.sku} in stock`);
  }
  const gross = product.unitPriceCents * qty;
  const discountCents = qty >= 10 ? Math.round(gross * 0.1) : 0;
  return {
    sku: product.sku,
    qty,
    unitPriceCents: product.unitPriceCents,
    lineTotalCents: gross - discountCents,
    discountCents,
  };
}
