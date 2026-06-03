// The routing FACADE — the heart of a strangler-fig migration. It sits in
// front of legacy and new implementations and, per route, sends traffic to
// one or the other based on a migration mode: off (legacy), canary (a % to
// new), or full (new). It tracks metrics so cutover is data-driven, and
// supports instant rollback. One route migrates at a time; the legacy system
// is "strangled" gradually with no big-bang flag day.

import type { Request, Response } from "./services.js";

export type Mode =
  | { kind: "legacy" }
  | { kind: "canary"; percent: number } // 0..1 fraction sent to NEW
  | { kind: "new" };

type Handler = (req: Request) => Response;

interface RouteConfig {
  legacy: Handler;
  modern: Handler;
  mode: Mode;
}

export class RoutingFacade {
  private readonly routes = new Map<string, RouteConfig>();
  readonly metrics = new Map<string, { legacy: number; new: number }>();

  register(route: string, legacy: Handler, modern: Handler): void {
    this.routes.set(route, { legacy, modern, mode: { kind: "legacy" } });
    this.metrics.set(route, { legacy: 0, new: 0 });
  }

  setMode(route: string, mode: Mode): void {
    const cfg = this.routes.get(route);
    if (!cfg) throw new Error(`unknown route: ${route}`);
    cfg.mode = mode;
  }

  /** Instant rollback — the safety net that makes incremental migration safe. */
  rollback(route: string): void {
    this.setMode(route, { kind: "legacy" });
  }

  /** `roll` (0..1) is injectable so canary routing is deterministic in tests. */
  handle(route: string, req: Request, roll: number = Math.random()): Response {
    const cfg = this.routes.get(route);
    if (!cfg) throw new Error(`unknown route: ${route}`);

    const useNew =
      cfg.mode.kind === "new" ||
      (cfg.mode.kind === "canary" && roll < cfg.mode.percent);

    const m = this.metrics.get(route)!;
    if (useNew) m.new++;
    else m.legacy++;

    return useNew ? cfg.modern(req) : cfg.legacy(req);
  }
}
