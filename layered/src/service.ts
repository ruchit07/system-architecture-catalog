// ── Application / Service Layer ────────────────────────────────────
// Orchestrates a use case: pull data (data layer), apply rules (domain
// layer), persist the result. It coordinates; it does not contain the
// business rules itself. Depends DOWN on domain + data, never UP on the API.

import { ProductRepository } from "./data.js";
import { priceLine, type PricedLine } from "./domain.js";

export interface OrderResult {
  lines: PricedLine[];
  totalCents: number;
}

export class OrderService {
  constructor(private readonly products: ProductRepository) {}

  placeOrder(items: { sku: string; qty: number }[]): OrderResult {
    const lines: PricedLine[] = [];
    for (const item of items) {
      const product = this.products.findBySku(item.sku);
      if (!product) throw new Error(`unknown sku: ${item.sku}`);
      lines.push(priceLine(product, item.qty)); // domain rule
    }
    // Only mutate state after all lines validate (atomic-ish use case).
    for (const item of items) this.products.decrementStock(item.sku, item.qty);
    const totalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
    return { lines, totalCents };
  }
}
