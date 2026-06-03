// A tiny LOCAL function runtime that emulates a FaaS platform: functions are
// registered against triggers (http / event / schedule) and invoked with an
// event + a context that lets them emit further events. The point is the
// serverless model — small, stateless, event-triggered handlers — and that
// you can run/test it locally without deploying to a cloud account.

export interface FnContext {
  emit: (eventType: string, payload: unknown) => void;
}

export type FnHandler = (event: unknown, ctx: FnContext) => Promise<unknown> | unknown;

export class LocalRuntime {
  private readonly handlers = new Map<string, FnHandler[]>();

  /** trigger examples: "http:POST /orders", "event:OrderCreated", "schedule:nightly" */
  register(trigger: string, handler: FnHandler): void {
    const list = this.handlers.get(trigger) ?? [];
    list.push(handler);
    this.handlers.set(trigger, list);
  }

  /** Invoke a trigger; emitted events cascade to their "event:" handlers. */
  async invoke(trigger: string, event: unknown): Promise<unknown> {
    const emitted: { type: string; payload: unknown }[] = [];
    const ctx: FnContext = { emit: (type, payload) => emitted.push({ type, payload }) };

    let last: unknown;
    for (const h of this.handlers.get(trigger) ?? []) {
      last = await h(event, ctx);
    }

    // Cascade emitted events to their event-triggered functions (fan-out).
    for (const e of emitted) {
      await this.invoke(`event:${e.type}`, e.payload);
    }
    return last;
  }
}
