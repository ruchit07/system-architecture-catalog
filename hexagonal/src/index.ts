// ── Composition root ───────────────────────────────────────────────
// The ONLY place that knows about both the domain and the adapters.
// It wires concrete adapters into the domain service. To go to
// production, swap InMemoryUserRepository -> PostgresUserRepository
// and ConsoleNotifier -> your real email adapter. Nothing else changes.

import { SignupService } from "./domain.js";
import { ConsoleNotifier, InMemoryUserRepository } from "./adapters.js";

async function main() {
  const service = new SignupService(
    new InMemoryUserRepository(),
    new ConsoleNotifier(),
  );

  const user = await service.signup("hello@ruchitsuthar.com");
  console.log("created:", user);

  try {
    await service.signup("hello@ruchitsuthar.com");
  } catch (err) {
    console.log("expected rejection:", (err as Error).message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
