import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Lazy + cached on the global scope: nothing connects at import time (that
// would break `next build`'s page-data collection when MONGODB_URI isn't
// set yet), and a cold serverless invocation reuses the existing
// connection instead of opening a new one against the Atlas free-tier
// connection limit.
export function getMongoClient(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db();
}
