// ── Ports ──────────────────────────────────────────────────────────
// The domain OWNS these interfaces. The outside world implements them.
// Nothing here knows about databases, HTTP, or email libraries.

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

/** Port: how the domain persists and looks up users. */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

/** Port: how the domain notifies the outside world. */
export interface Notifier {
  sendWelcome(user: User): Promise<void>;
}
