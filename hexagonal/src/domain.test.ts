// ── Domain tests: zero infrastructure ──────────────────────────────
// No database, no network, no email server. We test the business rule
// using the in-memory adapter and a fake notifier. This is only possible
// because the domain depends on ports, not concrete implementations.

import { test } from "node:test";
import assert from "node:assert/strict";

import { SignupService, EmailAlreadyRegisteredError } from "./domain.js";
import { InMemoryUserRepository } from "./adapters.js";
import type { Notifier, User } from "./ports.js";

class FakeNotifier implements Notifier {
  public sent: User[] = [];
  async sendWelcome(user: User): Promise<void> {
    this.sent.push(user);
  }
}

test("signs up a new user and sends a welcome", async () => {
  const repo = new InMemoryUserRepository();
  const notifier = new FakeNotifier();
  const service = new SignupService(repo, notifier);

  const user = await service.signup("Ada@Example.com");

  assert.equal(user.email, "ada@example.com"); // normalized
  assert.equal(notifier.sent.length, 1);
  assert.equal(await repo.findByEmail("ada@example.com") !== null, true);
});

test("rejects a duplicate email", async () => {
  const repo = new InMemoryUserRepository();
  const service = new SignupService(repo, new FakeNotifier());

  await service.signup("dup@example.com");

  await assert.rejects(
    () => service.signup("dup@example.com"),
    EmailAlreadyRegisteredError,
  );
});

test("rejects an invalid email", async () => {
  const service = new SignupService(new InMemoryUserRepository(), new FakeNotifier());
  await assert.rejects(() => service.signup("not-an-email"));
});
