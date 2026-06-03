// ── Presentation Layer (top) ───────────────────────────────────────
// Translates the outside world (HTTP, here a plain function) into a
// service call and formats the response. No business rules. Depends DOWN
// on the service layer only — never reaches past it into data/domain.

import { OrderService } from "./service.js";

export interface ApiResponse {
  status: number;
  body: unknown;
}

export class OrderController {
  constructor(private readonly orders: OrderService) {}

  // Simulates handling POST /orders
  createOrder(request: { items: { sku: string; qty: number }[] }): ApiResponse {
    try {
      const result = this.orders.placeOrder(request.items);
      return { status: 201, body: { total: result.totalCents / 100, lines: result.lines } };
    } catch (err) {
      return { status: 400, body: { error: (err as Error).message } };
    }
  }
}
