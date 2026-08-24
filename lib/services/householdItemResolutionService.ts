import { ObjectId, ClientSession } from "mongodb";
import { globalItemRepository } from "@/lib/repositories/globalItemRepository";
import { householdItemRepository } from "@/lib/repositories/householdItemRepository";
import type { GlobalItem } from "@/lib/schemas/globalItem";
import type { HouseholdItem } from "@/lib/schemas/householdItem";
import type { Location } from "@/lib/schemas/shared";

export interface CatalogSearchResult {
  globalMatches: GlobalItem[];
  householdMatches: HouseholdItem[];
}

export interface ManualHouseholdItemInput {
  name: string;
  category: string;
  defaultUnit: string;
  defaultShelfLifeDays: number;
  defaultLocation: Location;
}

// Mirrors itemResolutionService.ts, scoped by householdId instead of
// userId — same resolve-on-contact shape (docs/03-resolution-flows.md).
export async function searchHouseholdCatalog(
  householdId: ObjectId,
  query: string
): Promise<CatalogSearchResult> {
  const [globalMatches, householdMatches] = await Promise.all([
    globalItemRepository.searchByName(query),
    householdItemRepository.searchByName(householdId, query),
  ]);
  return { globalMatches, householdMatches };
}

export async function resolveGlobalItemForHousehold(
  householdId: ObjectId,
  addedByUserId: ObjectId,
  globalItemId: ObjectId,
  session?: ClientSession
): Promise<HouseholdItem> {
  const existing = await householdItemRepository.findByGlobalItemId(householdId, globalItemId);
  if (existing) return existing;

  const globalItem = await globalItemRepository.findById(globalItemId);
  if (!globalItem) throw new Error("Global item not found");

  return householdItemRepository.create(
    {
      householdId,
      addedByUserId,
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

export async function resolveExistingHouseholdItem(
  householdId: ObjectId,
  householdItemId: ObjectId
): Promise<HouseholdItem> {
  const item = await householdItemRepository.findById(householdId, householdItemId);
  if (!item) throw new Error("Item not found");
  return item;
}

export async function createManualHouseholdItem(
  householdId: ObjectId,
  addedByUserId: ObjectId,
  input: ManualHouseholdItemInput,
  session?: ClientSession
): Promise<HouseholdItem> {
  return householdItemRepository.create(
    {
      householdId,
      addedByUserId,
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
