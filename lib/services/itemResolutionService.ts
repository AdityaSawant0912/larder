import { ObjectId, ClientSession } from "mongodb";
import { globalItemRepository } from "@/lib/repositories/globalItemRepository";
import { userItemRepository } from "@/lib/repositories/userItemRepository";
import type { GlobalItem } from "@/lib/schemas/globalItem";
import type { UserItem } from "@/lib/schemas/userItem";
import type { Location } from "@/lib/schemas/shared";

export interface CatalogSearchResult {
  globalMatches: GlobalItem[];
  userMatches: UserItem[];
}

export interface ManualItemInput {
  name: string;
  category: string;
  defaultUnit: string;
  defaultShelfLifeDays: number;
  defaultLocation: Location;
}

// Step 1-3 of docs/03-resolution-flows.md — typeahead search across both
// catalogs so the UI can offer global matches, user matches, or "add new".
export async function searchCatalog(userId: ObjectId, query: string): Promise<CatalogSearchResult> {
  const [globalMatches, userMatches] = await Promise.all([
    globalItemRepository.searchByName(query),
    userItemRepository.searchByName(userId, query),
  ]);
  return { globalMatches, userMatches };
}

// Step 2/4 — given a chosen global item, use the existing linked userItem
// if one exists, otherwise create one now (copying global defaults in).
// This is the only seeding moment: one item at a time, on contact.
export async function resolveGlobalItem(
  userId: ObjectId,
  globalItemId: ObjectId,
  session?: ClientSession
): Promise<UserItem> {
  const existing = await userItemRepository.findByGlobalItemId(userId, globalItemId);
  if (existing) return existing;

  const globalItem = await globalItemRepository.findById(globalItemId);
  if (!globalItem) throw new Error("Global item not found");

  return userItemRepository.create(
    {
      userId,
      name: globalItem.name,
      category: globalItem.category,
      globalItemId: globalItem._id,
      defaultUnit: globalItem.defaultUnit,
      defaultShelfLifeDays: globalItem.defaultShelfLifeDays,
      defaultLocation: globalItem.defaultLocation,
      thresholds: [],
      forms: [],
    },
    session
  );
}

// Step 3 (not found in global) — user picked one of their own existing
// items directly.
export async function resolveExistingUserItem(
  userId: ObjectId,
  userItemId: ObjectId
): Promise<UserItem> {
  const item = await userItemRepository.findById(userId, userItemId);
  if (!item) throw new Error("Item not found");
  return item;
}

// Step 3 "missing" branch — manual entry, creates a fresh userItems doc
// with globalItemId: null.
export async function createManualItem(
  userId: ObjectId,
  input: ManualItemInput,
  session?: ClientSession
): Promise<UserItem> {
  return userItemRepository.create(
    {
      userId,
      name: input.name,
      category: input.category,
      globalItemId: null,
      defaultUnit: input.defaultUnit,
      defaultShelfLifeDays: input.defaultShelfLifeDays,
      defaultLocation: input.defaultLocation,
      thresholds: [],
      forms: [],
    },
    session
  );
}
