# ADR-0002: Start as a modular monolith, not microservices

- **Status:** Accepted
- **Date:** 2026-05-26
- **Deciders:** Ruchit, Engineering

## Context

We're designing the initial system shape. There's pressure (mostly from blog posts and a couple of new hires' prior experience) to "do microservices from the start so we don't have to migrate later." The forces that actually apply to us:

- One team of 6 engineers; everyone can hold the whole system in their heads.
- No independent-deploy-cadence problem yet — we deploy together and it's fine.
- We value the ability to refactor boundaries cheaply while the domain is still being discovered.
- Distributed-systems failure modes (network partitions, distributed transactions, multi-service debugging) would be pure cost at our size.

## Decision

We will build a **modular monolith**: a single deployable, internally divided into modules (orders, billing, identity) with **enforced** boundaries — separate schemas and a dependency test that fails CI on cross-module internal access. Module boundaries are chosen to be plausible future service boundaries.

## Options considered

### Option A: Modular monolith (chosen)
- **Pros:** clean boundaries and ownership without the distributed tax; single stack trace for debugging; cross-module transactions when needed; cheap to refactor boundaries; extractable to services later.
- **Cons:** requires discipline/tooling to keep boundaries from eroding.
- **Effort:** Low.

### Option B: Microservices from day one
- **Pros:** independent deploys and scaling per service.
- **Cons:** we have no organizational need for independent deploys yet; network failures, distributed transactions, and multi-service debugging are cost with no current benefit; boundaries are expensive to move while the domain is still fluid.
- **Effort:** High. **Rejected** — solves an organizational problem we don't have, at the cost of problems we'd rather not have.

### Option C: Big-ball-of-mud monolith
- **Pros:** fastest to start.
- **Cons:** no boundaries → becomes unmaintainable and un-extractable.
- **Effort:** Low now, High later. **Rejected** — the boundaries are the whole point.

## Consequences

**Positive**
- Maximum velocity and debuggability at our current size.
- Boundaries exist, so extracting a service later (if we hit ~30 engineers / independent-deploy pressure) is an afternoon per module, not a rewrite.

**Negative**
- We must invest in boundary enforcement (separate schemas, dependency tests) and resist "just this once" cross-module reach-ins.

**Follow-ups**
- Revisit when team size and deploy-coordination pain indicate a real need for independent service deployment. See [microservices/](../microservices) for the extraction target.
