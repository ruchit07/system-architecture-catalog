import { RoutingFacade } from "./facade.js";
import { legacy, modern } from "./services.js";

const f = new RoutingFacade();
f.register("GET /user", legacy.getUser, modern.getUser);
f.register("GET /orders", legacy.getOrders, modern.getOrders);

console.log("before migration:", f.handle("GET /user", { path: "/user" }).source); // legacy

f.setMode("GET /user", { kind: "canary", percent: 0.5 });
console.log("canary roll 0.2:", f.handle("GET /user", { path: "/user" }, 0.2).source); // new
console.log("canary roll 0.8:", f.handle("GET /user", { path: "/user" }, 0.8).source); // legacy

f.setMode("GET /user", { kind: "new" });
console.log("fully migrated:", f.handle("GET /user", { path: "/user" }).source); // new
console.log("/orders untouched:", f.handle("GET /orders", { path: "/orders" }).source); // legacy

f.rollback("GET /user");
console.log("after rollback:", f.handle("GET /user", { path: "/user" }).source); // legacy
console.log("metrics:", Object.fromEntries(f.metrics));
