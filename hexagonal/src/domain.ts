// ── Domain Core ────────────────────────────────────────────────────
// This file imports ONLY from ./ports — never from ./adapters.
// The dependency arrow points INWARD. That is the whole pattern.
//
// Because the service depends on interfaces, you can test the business
// rule with zero infrastructure (see domain.test.ts), and swap Postgres
// for DynamoDB by writing a new adapter without touching this file.

import type { Notifier, User, UserRepository } from "./ports.js";

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class SignupService {
  constructor(
    private readonly users: UserRepository,
    private readonly notifier: Notifier,
  ) {}

  /** Business rule: an email may register at most once. */
  async signup(email: string): Promise<User> {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      throw new Error(`Invalid email: ${email}`);
    }

    const existing = await this.users.findByEmail(normalized);
    if (existing) {
      throw new EmailAlreadyRegisteredError(normalized);
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: normalized,
      createdAt: new Date(),
    };

    await this.users.save(user);
    await this.notifier.sendWelcome(user);
    return user;
  }
}
