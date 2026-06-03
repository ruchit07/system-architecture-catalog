// The two systems the facade sits in front of during a migration: the LEGACY
// implementation (what exists) and the NEW one (what's replacing it, route by
// route). They expose the same contract so the facade can swap between them.

export interface Request {
  path: string;
  body?: unknown;
}
export interface Response {
  source: "legacy" | "new";
  status: number;
  body: unknown;
}

export const legacy = {
  getUser(_req: Request): Response {
    return { source: "legacy", status: 200, body: { name: "Ada", via: "mainframe" } };
  },
  getOrders(_req: Request): Response {
    return { source: "legacy", status: 200, body: { orders: 2, via: "mainframe" } };
  },
};

export const modern = {
  getUser(_req: Request): Response {
    return { source: "new", status: 200, body: { name: "Ada", via: "new-service" } };
  },
  getOrders(_req: Request): Response {
    return { source: "new", status: 200, body: { orders: 2, via: "new-service" } };
  },
};
