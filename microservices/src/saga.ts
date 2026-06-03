// A saga is how you get "all-or-nothing" semantics across services that DON'T
// share a database, so you can't use a single ACID transaction. Each step has
// an action and a COMPENSATION (the undo). If any step fails, the orchestrator
// runs the compensations for the already-completed steps, in reverse order.
//
// This is the pattern that replaces the (impossible) distributed transaction.

export interface SagaStep<C> {
  name: string;
  action: (ctx: C) => Promise<void>;
  /** The undo for `action`. Must be idempotent and should not throw. */
  compensate: (ctx: C) => Promise<void>;
}

export interface SagaResult {
  ok: boolean;
  completed: string[];   // steps whose action succeeded
  compensated: string[]; // steps that were rolled back (on failure)
  failedStep?: string;
  error?: string;
}

export class SagaOrchestrator<C> {
  constructor(private readonly steps: SagaStep<C>[]) {}

  async run(ctx: C): Promise<SagaResult> {
    const completed: SagaStep<C>[] = [];

    for (const step of this.steps) {
      try {
        await step.action(ctx);
        completed.push(step);
      } catch (err) {
        // A step failed: compensate everything completed so far, in REVERSE.
        const compensated: string[] = [];
        for (const done of [...completed].reverse()) {
          await done.compensate(ctx); // compensations must not throw
          compensated.push(done.name);
        }
        return {
          ok: false,
          completed: completed.map((s) => s.name),
          compensated,
          failedStep: step.name,
          error: (err as Error).message,
        };
      }
    }

    return { ok: true, completed: completed.map((s) => s.name), compensated: [] };
  }
}
