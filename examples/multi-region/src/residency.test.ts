import { test } from "node:test";
import assert from "node:assert/strict";

import { ResidencyRouter, type Region } from "./residency.js";

const allUp = new Set<Region>(["us-east", "eu-west", "ap-india"]);
const router = new ResidencyRouter();

test("EU tenant's pinned data is served in the EU", () => {
  const d = router.route({ tenantZone: "EU", dataClass: "residency-pinned", preferredRegion: "us-east" }, allUp);
  assert.equal(d.servedBy, "eu-west"); // NOT us-east, even though that's preferred
  assert.equal(d.allowed, true);
});

test("India tenant's pinned data is served in India", () => {
  const d = router.route({ tenantZone: "IN", dataClass: "residency-pinned", preferredRegion: "eu-west" }, allUp);
  assert.equal(d.servedBy, "ap-india");
});

test("pinned data REFUSES rather than violate residency when the zone is down", () => {
  const euDown = new Set<Region>(["us-east", "ap-india"]); // eu-west unhealthy
  const d = router.route({ tenantZone: "EU", dataClass: "residency-pinned", preferredRegion: "eu-west" }, euDown);
  assert.equal(d.allowed, false);
  assert.equal(d.servedBy, null); // will NOT fail over to US — compliance over availability
});

test("global data optimizes for latency (preferred region)", () => {
  const d = router.route({ tenantZone: "EU", dataClass: "global", preferredRegion: "us-east" }, allUp);
  assert.equal(d.servedBy, "us-east");
});

test("global data fails over anywhere when preferred region is down", () => {
  const usDown = new Set<Region>(["eu-west", "ap-india"]);
  const d = router.route({ tenantZone: "EU", dataClass: "global", preferredRegion: "us-east" }, usDown);
  assert.equal(d.allowed, true);
  assert.notEqual(d.servedBy, "us-east"); // failed over to a healthy region
});
