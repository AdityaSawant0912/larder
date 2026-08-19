// Run once MONGODB_URI points at a real Atlas cluster:
//   npm run setup:search-indexes
import { config } from "dotenv";
// .env.local is Next's actual convention (see docs/.env.example) — plain
// "dotenv/config" only loads .env and silently no-ops here.
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import { nameSearchIndexDefinition, SEARCH_INDEXED_COLLECTIONS } from "../lib/db/searchIndexes";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const existingCollections = new Set((await db.listCollections().toArray()).map((c) => c.name));

  for (const name of SEARCH_INDEXED_COLLECTIONS) {
    // Atlas Search indexes can't be created on a collection that doesn't
    // exist yet (e.g. globalItems before anything's ever been written to
    // it) — create it empty first.
    if (!existingCollections.has(name)) {
      await db.createCollection(name);
      console.log(`[created collection] ${name}`);
    }

    const collection = db.collection(name);
    const existing = await collection
      .listSearchIndexes(nameSearchIndexDefinition.name)
      .toArray()
      .catch(() => []);

    if (existing.length > 0) {
      console.log(`[skip] ${name}: "${nameSearchIndexDefinition.name}" index already exists`);
      continue;
    }

    await collection.createSearchIndex(nameSearchIndexDefinition);
    console.log(`[created] ${name}: "${nameSearchIndexDefinition.name}" search index queued (Atlas builds it async)`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
