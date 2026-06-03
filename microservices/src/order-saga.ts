import { SagaOrchestrator, type SagaStep } from "./saga.js";

// Three independent services, each owning its own state (no shared DB — that's
// the point of microservices). In a real system these are network calls; here
// they're in-memory so the saga mechanics are legible. Each can be told to
// fail, to demonstrate compensation.

export class PaymentService {
  charged = new Set<string>();
  constructor(public failOn = false) {}
  async charge(orderId: string) {
    if (this.failOn) throw new Error("payment declined");
    this.charged.add(orderId);
  }
  async refund(orderId: string) {
    this.charged.delete(orderId); // compensation — idempotent
  }
}

export class InventoryService {
  reserved = new Set<string>();
  constructor(public failOn = false) {}
  async reserve(orderId: string) {
    if (this.failOn) throw new Error("out of stock");
    this.reserved.add(orderId);
  }
  async release(orderId: string) {
    this.reserved.delete(orderId);
  }
}

export class ShippingService {
  scheduled = new Set<string>();
  constructor(public failOn = false) {}
  async schedule(orderId: string) {
    if (this.failOn) throw new Error("no carrier capacity");
    this.scheduled.add(orderId);
  }
  async cancel(orderId: string) {
    this.scheduled.delete(orderId);
  }
}

export interface OrderContext {
  orderId: string;
}

// Wire the three services into an ordered saga. If shipping fails, the
// orchestrator will release inventory and refund the payment automatically.
export function buildOrderSaga(
  payment: PaymentService,
  inventory: InventoryService,
  shipping: ShippingService,
): SagaOrchestrator<OrderContext> {
  const steps: SagaStep<OrderContext>[] = [
    {
      name: "charge-payment",
      action: (c) => payment.charge(c.orderId),
      compensate: (c) => payment.refund(c.orderId),
    },
    {
      name: "reserve-inventory",
      action: (c) => inventory.reserve(c.orderId),
      compensate: (c) => inventory.release(c.orderId),
    },
    {
      name: "schedule-shipping",
      action: (c) => shipping.schedule(c.orderId),
      compensate: (c) => shipping.cancel(c.orderId),
    },
  ];
  return new SagaOrchestrator(steps);
}
