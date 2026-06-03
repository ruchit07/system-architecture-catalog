// ── Adapters ───────────────────────────────────────────────────────
// Implementations of the ports. The domain never imports this file;
// the composition root (index.ts) or the tests do the wiring.
//
// Swap these for a Postgres repository or an SES notifier and the
// domain code does not change. That is the payoff of the pattern.

import type { Notifier, User, UserRepository } from "./ports.js";

/** In-memory repository — perfect for tests and local dev. */
export class InMemoryUserRepository implements UserRepository {
  private readonly byEmail = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    return this.byEmail.get(email) ?? null;
  }

  async save(user: User): Promise<void> {
    this.byEmail.set(user.email, user);
  }
}

/** Stub notifier — logs instead of sending real email. */
export class ConsoleNotifier implements Notifier {
  async sendWelcome(user: User): Promise<void> {
    console.log(`[notifier] welcome email -> ${user.email}`);
  }
}

// A real adapter would look like this (sketch — not wired):
//
// export class PostgresUserRepository implements UserRepository {
//   constructor(private readonly db: Pool) {}
//   async findByEmail(email: string) { /* SELECT ... */ }
//   async save(user: User) { /* INSERT ... */ }
// }
//
// Note: same interface, zero changes to domain.ts.
