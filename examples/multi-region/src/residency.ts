// ── Residency-aware router ──────────────────────────────────────────
// The hard part of a compliant multi-region SaaS: route each request to a
// region that satisfies BOTH availability (serve from a healthy region) and
// DATA RESIDENCY (residency-pinned data for an EU tenant must never leave the
// EU, even during a failover). This is the code companion to the GDPR /
// data-localization architecture.
//
// Key rule: under failure, residency-pinned data fails over ONLY within the
// tenant's residency zone. If no in-zone region is healthy, we REFUSE rather
// than violate residency — a CP-style choice for compliance.

export type Region = "us-east" | "eu-west" | "ap-india";
export type Zone = "US" | "EU" | "IN";
export type DataClass = "residency-pinned" | "global";

export const REGION_ZONE: Record<Region, Zone> = {
  "us-east": "US",
  "eu-west": "EU",
  "ap-india": "IN",
};

export interface RouteRequest {
  /** The tenant's required residency zone (where pinned data must live). */
  tenantZone: Zone;
  dataClass: DataClass;
  /** Where the user is, for latency-optimal routing of global data. */
  preferredRegion: Region;
}

export interface RouteDecision {
  servedBy: Region | null;
  allowed: boolean;
  reason: string;
}

export class ResidencyRouter {
  constructor(private readonly allRegions: Region[] = ["us-east", "eu-west", "ap-india"]) {}

  route(req: RouteRequest, healthy: Set<Region>): RouteDecision {
    if (req.dataClass === "residency-pinned") {
      // Candidates restricted to the tenant's residency zone — non-negotiable.
      const inZone = this.allRegions.filter((r) => REGION_ZONE[r] === req.tenantZone);
      const healthyInZone = inZone.filter((r) => healthy.has(r));
      if (healthyInZone.length === 0) {
        return { servedBy: null, allowed: false, reason: `no healthy ${req.tenantZone} region; refusing to violate residency` };
      }
      // Prefer the user's region if it happens to be in-zone, else any in-zone.
      const choice = healthyInZone.includes(req.preferredRegion) ? req.preferredRegion : healthyInZone[0]!;
      return { servedBy: choice, allowed: true, reason: `served in-zone (${req.tenantZone})` };
    }

    // Global (non-pinned) data: optimize for latency — nearest healthy region.
    if (healthy.has(req.preferredRegion)) {
      return { servedBy: req.preferredRegion, allowed: true, reason: "global data, preferred region healthy" };
    }
    const anyHealthy = this.allRegions.find((r) => healthy.has(r));
    return anyHealthy
      ? { servedBy: anyHealthy, allowed: true, reason: "global data, failed over to nearest healthy" }
      : { servedBy: null, allowed: false, reason: "no healthy region anywhere" };
  }
}
