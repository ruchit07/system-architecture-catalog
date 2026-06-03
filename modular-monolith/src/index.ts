import { createInventoryModule } from "./modules/inventory/index.js";
import { createOrdersModule } from "./modules/orders/index.js";

// Composition root: wire the modules together in a single deployable.
const inventory = createInventoryModule();
inventory.seed("WIDGET", 5);
const orders = createOrdersModule(inventory);

console.log(orders.place("WIDGET", 3)); // placed
console.log("available:", inventory.available("WIDGET")); // 2
console.log(orders.place("WIDGET", 3)); // rejected — boundary respected, stock owned by inventory
