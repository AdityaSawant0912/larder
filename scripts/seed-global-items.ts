// Seeds the globalItems catalog (data/global-items.json) into Mongo.
// Idempotent: skips names (case-insensitive) that already exist.
//   npm run seed:global-items
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globalItemRepository } from "../lib/repositories/globalItemRepository";
import { globalItemInputSchema, type GlobalItemInput } from "../lib/schemas/globalItem";

async function main() {
  const raw = JSON.parse(readFileSync(join(__dirname, "../data/global-items.json"), "utf8"));
  const parsed: GlobalItemInput[] = raw.map((entry: unknown) => globalItemInputSchema.parse(entry));

  const existingNames = new Set((await globalItemRepository.findAllNames()).map((n) => n.toLowerCase()));
  const toInsert = parsed.filter((item) => !existingNames.has(item.name.toLowerCase()));

  if (toInsert.length > 0) {
    await globalItemRepository.createMany(toInsert);
  }

  console.log(`[seed:global-items] inserted ${toInsert.length}, skipped ${parsed.length - toInsert.length} (already present), total in file ${parsed.length}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
