// ── The Port: your application's STABLE internal contract for "an LLM" ──
// Your domain code depends on THIS, never on a vendor SDK. Swapping
// OpenAI ↔ Anthropic ↔ a local model becomes a new adapter, not a rewrite.
// This single interface is what stops your core from coupling to a provider.

export interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
}

export interface CompletionResult {
  text: string;
  tokens: number;
  provider: string;
}

export interface LlmProvider {
  readonly name: string;
  /** Cost per 1K tokens in cents — used by the gateway's budget control. */
  readonly costPer1kCents: number;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

export class ProviderUnavailableError extends Error {}
export class BudgetExceededError extends Error {}
export class GuardrailError extends Error {}
