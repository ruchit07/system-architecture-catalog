# Hexagonal Architecture (Ports & Adapters)

The domain sits in the center, knowing nothing about the outside world. It defines *ports* (interfaces). The outside world — HTTP, databases, message brokers, third-party APIs — plugs in through *adapters* that implement those ports.

```mermaid
flowchart TD
    subgraph Core [Domain Core]
        D[Business Logic]
        P1([Port: Repository])
        P2([Port: Notifier])
    end
    HTTP[HTTP Adapter] --> D
    CLI[CLI Adapter] --> D
    D --> P1 --> DB[(Postgres Adapter)]
    D --> P2 --> EMAIL[Email Adapter]
```

## Use it when
- The business logic is valuable and long-lived, but the infrastructure isn't.
- You want to test the domain with **zero infrastructure**.
- You expect the surrounding tech to change (over a 5-year horizon, it always does).

## How it goes wrong
Ceremony for a CRUD app. If your "domain logic" is forwarding a request to the database, ports and adapters add indirection that buys you nothing. Hexagonal earns its keep when there's real logic to protect.

## What to look at (runnable reference)

This folder contains a **runnable** TypeScript example — the exemplar of the catalog.

- [`src/domain.ts`](./src/domain.ts) — the core. A `SignupService` with a real rule (no duplicate emails). It depends only on **ports** (`UserRepository`, `Notifier`), never on a database or email library.
- [`src/ports.ts`](./src/ports.ts) — the interfaces the domain owns.
- [`src/adapters.ts`](./src/adapters.ts) — an in-memory repository (for tests/dev) and a stub email notifier. Swapping in Postgres means writing one new adapter — the domain doesn't change.
- [`src/domain.test.ts`](./src/domain.test.ts) — tests the business rule with **zero infrastructure**, using the in-memory adapter.

### Run it

```bash
cd hexagonal
npm install
npm test       # runs the domain tests with the in-memory adapter
npm start      # runs the demo wiring the service to adapters
```

The key insight: read `domain.ts` and notice it imports nothing from `adapters.ts`. The dependency arrow points **inward**. That's the whole pattern.
