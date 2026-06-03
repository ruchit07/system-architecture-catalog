// An event is a fact about something that happened. The `id` is what makes
// idempotency possible — it uniquely identifies this occurrence so a consumer
// can recognize a redelivery.

export interface Event<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export type Handler = (event: Event) => Promise<void>;
