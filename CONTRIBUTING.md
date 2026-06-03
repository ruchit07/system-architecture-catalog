# Contributing

Thanks for your interest in improving the System Architecture Catalog.

## What makes a good contribution

This catalog optimizes for **honest trade-offs over completeness**. A reference implementation here is teaching material, not a framework. Good contributions:

- **Show the seams.** The point is to make the architecture's structure legible. Prefer clarity over cleverness.
- **State the forces.** Every pattern README must answer: when is this the *right* call, and how does it go *wrong*? The failure mode is as important as the happy path.
- **Stay runnable and small.** A reference implementation should run with one command and fit in your head. If it needs a 200-line setup, it's too big.
- **No cargo cult.** If a pattern is over-applied in the wild (looking at you, microservices and event sourcing), say so plainly.

## How to add a reference implementation

1. Pick a folder from the catalog that's missing an implementation (see the roadmap in the root README).
2. Add the smallest example that demonstrates the pattern's defining property.
3. Include a `README.md` section: **What to look at** — point readers to the specific files/lines where the architecture's key decision lives.
4. Make it run: a `package.json` script (or equivalent) that executes the example and any tests with one command.
5. Keep dependencies minimal.

## Conventions

- One architecture per top-level folder.
- Diagrams in Mermaid (renders on GitHub).
- Capture non-obvious design decisions as an ADR in [`/adr`](./adr) using the [template](./adr/0000-template.md).

## Code of conduct

Be kind, be precise, assume good faith. Disagree about trade-offs in the open — that's the whole point of this repo.
