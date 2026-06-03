import { buildOrderSaga, PaymentService, InventoryService, ShippingService } from "./order-saga.js";

async function main() {
  console.log("--- happy path ---");
  const ok = buildOrderSaga(new PaymentService(), new InventoryService(), new ShippingService());
  console.log(await ok.run({ orderId: "order-100" }));

  console.log("\n--- shipping fails → payment + inventory rolled back ---");
  const fail = buildOrderSaga(new PaymentService(), new InventoryService(), new ShippingService(true));
  console.log(await fail.run({ orderId: "order-101" }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
