import { LocalRuntime } from "./runtime.js";
import { createOrder, processOrder, nightlyReport, makeStore } from "./functions.js";

const store = makeStore();
const rt = new LocalRuntime();
rt.register("http:POST /orders", createOrder(store));
rt.register("event:OrderCreated", processOrder(store));
rt.register("schedule:nightly", nightlyReport(store));

const main = async () => {
  console.log("POST /orders ->", await rt.invoke("http:POST /orders", { sku: "WIDGET" }));
  console.log("POST /orders (bad) ->", await rt.invoke("http:POST /orders", {}));
  console.log("nightly report ->", await rt.invoke("schedule:nightly", {}));
};
main().catch((e) => { console.error(e); process.exit(1); });
