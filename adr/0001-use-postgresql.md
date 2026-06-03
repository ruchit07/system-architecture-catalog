# ADR-0001: Use PostgreSQL for the primary datastore

- **Status:** Accepted
- **Date:** 2026-05-26
- **Deciders:** Ruchit, Platform team

## Context

We need a primary datastore for a transactional B2B product. The forces:

- 5-person team, strongest in SQL; limited ops capacity.
- ~2M transactions/month today, growing but not hyperscale.
- Strong consistency required for billing and payment flows.
- EU data-residency requirement for several customers.
- 18-month runway — velocity and operational simplicity matter more than theoretical ceiling.

## Decision

We will use **PostgreSQL** (managed, EU region) as the primary datastore.

## Options considered

### Option A: PostgreSQL (chosen)
- **Pros:** mature, strong transactional consistency, the team is fluent, excellent managed options in-region, supports Row-Level Security for future multi-tenancy.
- **Cons:** we own the sharding strategy if we ever exceed single-primary scale.
- **Effort:** Low.

### Option B: MongoDB
- **Pros:** flexible schema, easy horizontal scale-out.
- **Cons:** weaker transactional guarantees for our payment flows; team lacks operational depth.
- **Effort:** Medium. **Rejected** — consistency risk on the exact flows that matter most.

### Option C: DynamoDB
- **Pros:** serverless scale, minimal ops.
- **Cons:** access patterns are still fluid (DynamoDB punishes that); vendor lock-in; team unfamiliar.
- **Effort:** Medium. **Rejected** — premature commitment to access patterns we haven't validated.

## Consequences

**Positive**
- Strong consistency for billing/payments out of the box.
- Fast team velocity — no new datastore to learn.
- RLS gives us a path to safe shared multi-tenancy later.

**Negative**
- We own the sharding/partitioning strategy if write load outgrows a single primary.

**Follow-ups**
- Revisit when sustained write load approaches single-primary limits, or when a customer requires an isolation model PostgreSQL multi-tenancy can't satisfy.
