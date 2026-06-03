import { ProductRepository } from "./data.js";
import { OrderService } from "./service.js";
import { OrderController } from "./api.js";

const repo = new ProductRepository([
  { sku: "WIDGET", name: "Widget", unitPriceCents: 1000, stock: 100 },
]);
const controller = new OrderController(new OrderService(repo));

console.log("order of 12 (bulk discount):", controller.createOrder({ items: [{ sku: "WIDGET", qty: 12 }] }));
console.log("remaining stock:", repo.findBySku("WIDGET")?.stock);
console.log("over-order:", controller.createOrder({ items: [{ sku: "WIDGET", qty: 9999 }] }));
