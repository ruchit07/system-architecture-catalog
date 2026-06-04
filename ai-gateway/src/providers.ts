// ── Adapters: one per vendor, all implementing the same port ──
// In production these wrap the OpenAI / Anthropic / Bedrock SDKs. Here they're
// deterministic fakes (with a `failing` switch) so the gateway's behavior —
// fallback, caching, budgets, guardrails — is fully testable offline.

import type { LlmProvider, CompletionRequest, CompletionResult } from "./port.js";
import { ProviderUnavailableError } from "./port.js";

export class FakeProvider implements LlmProvider {
  constructor(
    public readonly name: string,
    public readonly costPer1kCents: number,
    public failing = false,
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    if (this.failing) throw new ProviderUnavailableError(`${this.name} is down`);
    const tokens = Math.ceil(req.prompt.length / 4) + 16;
    return { text: `[${this.name}] answer to: ${req.prompt}`, tokens, provider: this.name };
  }
}
