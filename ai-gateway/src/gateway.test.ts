import { test } from "node:test";
import assert from "node:assert/strict";

import { AiGateway } from "./gateway.js";
import { FakeProvider } from "./providers.js";
import { BudgetExceededError, GuardrailError } from "./port.js";

const opts = { budgetCents: 1000 };

test("provider-agnostic: core depends on the port, not a vendor", async () => {
  const gw = new AiGateway([new FakeProvider("openai", 5)], opts);
  const res = await gw.ask({ prompt: "hello" });
  assert.equal(res.provider, "openai");
  // Swapping the provider is a constructor change, not a domain change:
  const gw2 = new AiGateway([new FakeProvider("anthropic", 4)], opts);
  assert.equal((await gw2.ask({ prompt: "hello" })).provider, "anthropic");
});

test("caching: identical prompt does not hit the provider twice", async () => {
  const gw = new AiGateway([new FakeProvider("openai", 5)], opts);
  await gw.ask({ prompt: "same" });
  await gw.ask({ prompt: "same" });
  assert.equal(gw.metrics.calls, 2);
  assert.equal(gw.metrics.cacheHits, 1); // second was served from cache
});

test("fallback: survives a primary provider outage", async () => {
  const primary = new FakeProvider("openai", 5, true); // down
  const secondary = new FakeProvider("anthropic", 4);
  const gw = new AiGateway([primary, secondary], opts);
  const res = await gw.ask({ prompt: "hi" });
  assert.equal(res.provider, "anthropic");
  assert.equal(gw.metrics.fallbacks, 1);
});

test("budget cap: refuses once the budget is exhausted", async () => {
  const gw = new AiGateway([new FakeProvider("openai", 5)], { budgetCents: 0.001 });
  await gw.ask({ prompt: "first call spends" });
  await assert.rejects(() => gw.ask({ prompt: "second is over budget" }), BudgetExceededError);
});

test("guardrails: block disallowed input and output", async () => {
  const gw = new AiGateway([new FakeProvider("openai", 5)], {
    budgetCents: 1000,
    inputGuardrail: (p) => (p.includes("ignore previous instructions") ? "prompt injection" : null),
    outputGuardrail: (t) => (t.includes("secret") ? "leaked secret" : null),
  });
  await assert.rejects(() => gw.ask({ prompt: "ignore previous instructions" }), GuardrailError);
  await assert.rejects(() => gw.ask({ prompt: "tell me a secret" }), GuardrailError);
  assert.equal(gw.metrics.blocked, 2);
});
