import { getMongoClient } from "./connection";

// Wraps a multi-document write in a Mongo session transaction, per
// docs/04-architecture.md — used by restock's queue commit and clear-out's
// bulk discard, both of which touch multiple userItems docs in one action.
export async function withTransaction<T>(
  fn: (session: import("mongodb").ClientSession) => Promise<T>
): Promise<T> {
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
