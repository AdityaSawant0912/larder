import { ObjectId } from "mongodb";
import { globalStoreRepository, userStoreRepository } from "@/lib/repositories/storeRepository";
import type { UserStore, GlobalStore } from "@/lib/schemas/store";

export interface StoreSearchResult {
  globalMatches: GlobalStore[];
  userMatches: UserStore[];
}

export async function searchStores(userId: ObjectId, query: string): Promise<StoreSearchResult> {
  const [globalMatches, userMatches] = await Promise.all([
    globalStoreRepository.searchByName(query),
    userStoreRepository.searchByName(userId, query),
  ]);
  return { globalMatches, userMatches };
}

// docs/03-resolution-flows.md "Store resolution" — no copy step, only
// whether the store already exists in the user's list.
export async function resolveGlobalStore(userId: ObjectId, globalStoreId: ObjectId): Promise<UserStore> {
  const existing = await userStoreRepository.findByGlobalStoreId(userId, globalStoreId);
  if (existing) return existing;
  const match = await globalStoreRepository.findById(globalStoreId);
  if (!match) throw new Error("Global store not found");
  return userStoreRepository.create({
    userId,
    name: match.name,
    globalStoreId,
  });
}

export async function createPersonalStore(userId: ObjectId, name: string): Promise<UserStore> {
  return userStoreRepository.create({ userId, name, globalStoreId: null });
}
