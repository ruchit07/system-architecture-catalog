import { ResidencyRouter, type Region } from "./residency.js";

const router = new ResidencyRouter();
const allUp = new Set<Region>(["us-east", "eu-west", "ap-india"]);
const euDown = new Set<Region>(["us-east", "ap-india"]);

console.log("EU tenant, pinned, prefers US ->",
  router.route({ tenantZone: "EU", dataClass: "residency-pinned", preferredRegion: "us-east" }, allUp));

console.log("EU tenant, global, prefers US ->",
  router.route({ tenantZone: "EU", dataClass: "global", preferredRegion: "us-east" }, allUp));

console.log("EU tenant, pinned, EU region DOWN (must refuse) ->",
  router.route({ tenantZone: "EU", dataClass: "residency-pinned", preferredRegion: "eu-west" }, euDown));
