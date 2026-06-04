// ── The AI Gateway ──────────────────────────────────────────────────
// A single chokepoint between your application and any LLM provider. It
// centralizes the cross-cutting concerns you do NOT want scattered across
// (or coupled into) your domain code:
//   1. Provider abstraction + FALLBACK   (survive a vendor outage)
//   2. CACHING                           (don't pay twice for the same prompt)
//   3. BUDGET / rate control             (cost can't run away, incl. abuse)
//   4. GUARDRAILS in/out                 (block disallowed input/output)
//   5. OBSERVABILITY                     (metrics for every call)
// Your core depends on `ask()`, never on a vendor SDK.

import type { LlmProvider, CompletionRequest, CompletionResult } from "./port.js";
import { BudgetExceededError, GuardrailError, ProviderUnavailableError } from "./port.js";

export interface GatewayOptions {
  budgetCents: number;
  /** Return null to allow, or a string reason to block. */
  inputGuardrail?: (prompt: string) => string | null;
  outputGuardrail?: (text: string) => string | null;
}

export interface GatewayMetrics {
  calls: number;
  cacheHits: number;
  fallbacks: number;
  blocked: number;
  spentCents: number;
}

export class AiGateway {
  private readonly cache = new Map<string, CompletionResult>();
  readonly metrics: GatewayMetrics = { calls: 0, cacheHits: 0, fallbacks: 0, blocked: 0, spentCents: 0 };

  // Ordered provider chain: try [0], fall back to [1], [2]…
  constructor(private readonly providers: LlmProvider[], private readonly opts: GatewayOptions) {
    if (providers.length === 0) throw new Error("at least one provider required");
  }

  async ask(req: CompletionRequest): Promise<CompletionResult> {
    this.metrics.calls++;

    // 1. Input guardrail (e.g., block injection / PII / disallowed topics).
    const inputReason = this.opts.inputGuardrail?.(req.prompt);
    if (inputReason) {
      this.metrics.blocked++;
      throw new GuardrailError(`input blocked: ${inputReason}`);
    }

    // 2. Cache: identical prompt → no provider call, no spend.
    const key = JSON.stringify(req);
    const cached = this.cache.get(key);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    // 3. Budget cap: refuse before spending if we're over budget.
    if (this.metrics.spentCents >= this.opts.budgetCents) {
      throw new BudgetExceededError(`budget of ${this.opts.budgetCents}c exhausted`);
    }

    // 4. Provider abstraction + fallback across the chain.
    let result: CompletionResult | null = null;
    let lastErr: unknown;
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i]!;
      try {
        result = await provider.complete(req);
        if (i > 0) this.metrics.fallbacks++;
        this.metrics.spentCents += (result.tokens / 1000) * provider.costPer1kCents;
        break;
      } catch (err) {
        lastErr = err; // try the next provider in the chain
      }
    }
    if (!result) throw new ProviderUnavailableError(`all providers failed: ${(lastErr as Error)?.message}`);

    // 5. Output guardrail before returning to the caller.
    const outReason = this.opts.outputGuardrail?.(result.text);
    if (outReason) {
      this.metrics.blocked++;
      throw new GuardrailError(`output blocked: ${outReason}`);
    }

    this.cache.set(key, result);
    return result;
  }
}
