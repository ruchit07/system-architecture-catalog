# ADR-NNNN: <short, decision-focused title>

> An Architecture Decision Record captures one architecturally significant decision, the forces behind it, and its consequences. Significant = hard to reverse, affects multiple teams/components, or constrains future choices. Keep it to one screen; the *forces and rejected options* are the payload. Records are immutable — when a decision changes, write a new ADR that supersedes this one.

| | |
|---|---|
| **Status** | Proposed \| Accepted \| Superseded by [ADR-XXXX] \| Deprecated |
| **Date** | YYYY-MM-DD |
| **Deciders** | names / roles who own the decision |
| **Consulted** | who gave input (domain experts, security, SRE) |
| **Informed** | who needs to know |
| **Supersedes / Superseded by** | ADR links, if any |
| **Tags** | e.g. data, consistency, security, cost |

## Context and problem statement

What situation forces a decision now? State the problem in 2–4 sentences, then the **forces** — be concrete and quantified where possible:

- **Quality attributes at stake** (ranked): e.g. consistency > durability > availability > latency. Use testable scenarios, not adjectives ("50k reads/s at p99 < 150ms, 99.95% availability").
- **CAP/PACELC positioning** for the affected data flow(s): under partition, C or A? Normally, latency or consistency? (See [CAP guide](../docs/cap-theorem.md).)
- **Constraints:** team size & skills, deadline, budget, existing systems, regulatory regime, data residency.

## Decision drivers

The criteria this decision is judged against (these become the columns of your [decision matrix](../docs/choosing-an-architecture.md) and ideally get explicit weights):

- Driver 1 (weight) — …
- Driver 2 (weight) — …
- Driver 3 (weight) — …

## Considered options

### Option A: <name> — **chosen**
- **Pros:** …
- **Cons / risks:** …
- **Quality-attribute fit:** how it scores against the drivers above.
- **Cost / effort:** Low \| Medium \| High.

### Option B: <name>
- **Pros:** …
- **Cons / risks:** …
- **Why rejected:** the specific driver(s) it failed. *(This is the most valuable line in the document — it's what ends the same debate in two years.)*

### Option C: <name>
- **Pros / Cons / Why rejected:** …

> Analyze every option with equal depth and honest trade-offs. No biasing toward the favorite.

## Decision outcome

We will **<the choice>**, because **<the driver(s) it best satisfies>**.

Optionally include the weighted-scoring table that justifies it.

## Consequences

**Positive** — what becomes easier/better:
- …

**Negative** — what becomes harder, what we trade away (state it plainly):
- …

**Risks & mitigations** — what could go wrong and the plan:
- Risk … → mitigation …

## Security, compliance & operability

- **Security / data:** trust boundaries, sensitive data, authZ/authN impact.
- **Compliance:** regulatory obligations affected (audit, residency, retention).
- **Operability:** observability, failure modes, blast radius, DR/RTO/RPO impact, on-call burden.

## Validation

How we'll know the decision was right (make it falsifiable):

- **Fitness function / metric:** e.g. "p99 transfer latency < 500ms and zero reconciliation breaks for 30 days."
- **Review trigger — revisit this ADR when:** e.g. "sustained write load exceeds single-primary limits" / "team grows past 30 engineers" / "a customer requires physical data isolation."

## Links

- Related ADRs: …
- Relevant patterns: [catalog](../README.md)
- External references: …
