import { ObjectId, ClientSession } from "mongodb";
import { householdGroceryListCollection } from "@/lib/db/collections";
import {
  householdGroceryListItemSchema,
  householdGroceryListItemInputSchema,
  type HouseholdGroceryListItem,
  type HouseholdGroceryListItemInput,
} from "@/lib/schemas/householdGroceryList";

// Mirrors groceryListRepository.ts, scoped by householdId. No storeId
// (household grocery items are always "Any" — stores are personal).
export const householdGroceryListRepository = {
  async findAllForHousehold(householdId: ObjectId): Promise<HouseholdGroceryListItem[]> {
    const col = await householdGroceryListCollection();
    const docs = await col.find({ householdId }).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => householdGroceryListItemSchema.parse(d));
  },

  async findByIds(householdId: ObjectId, ids: ObjectId[]): Promise<HouseholdGroceryListItem[]> {
    const col = await householdGroceryListCollection();
    const docs = await col.find({ householdId, _id: { $in: ids } }).toArray();
    return docs.map((d) => householdGroceryListItemSchema.parse(d));
  },

  async findUnmergedMatch(
    householdId: ObjectId,
    criteria: { householdItemId: ObjectId | null; name: string; unit: string }
  ): Promise<HouseholdGroceryListItem | null> {
    const col = await householdGroceryListCollection();
    const doc = await col.findOne({
      householdId,
      householdItemId: criteria.householdItemId,
      name: criteria.name,
      unit: criteria.unit,
      checked: false,
    });
    return doc ? householdGroceryListItemSchema.parse(doc) : null;
  },

  async create(input: HouseholdGroceryListItemInput): Promise<HouseholdGroceryListItem> {
    const col = await householdGroceryListCollection();
    const parsed = householdGroceryListItemInputSchema.parse(input);
    const doc = { ...parsed, _id: new ObjectId(), createdAt: new Date() };
    await col.insertOne(doc);
    return householdGroceryListItemSchema.parse(doc);
  },

  async setChecked(householdId: ObjectId, id: ObjectId, checked: boolean): Promise<void> {
    const col = await householdGroceryListCollection();
    await col.updateOne({ _id: id, householdId }, { $set: { checked } });
  },

  async update(
    householdId: ObjectId,
    id: ObjectId,
    patch: Partial<Pick<HouseholdGroceryListItem, "qty" | "unit" | "name" | "category">>
  ): Promise<void> {
    const col = await householdGroceryListCollection();
    await col.updateOne({ _id: id, householdId }, { $set: patch });
  },

  async delete(householdId: ObjectId, id: ObjectId): Promise<void> {
    const col = await householdGroceryListCollection();
    await col.deleteOne({ _id: id, householdId });
  },

  async deleteMany(householdId: ObjectId, ids: ObjectId[], session?: ClientSession): Promise<void> {
    const col = await householdGroceryListCollection();
    await col.deleteMany({ householdId, _id: { $in: ids } }, { session });
  },

  async deleteAllForHousehold(householdId: ObjectId, session?: ClientSession): Promise<void> {
    const col = await householdGroceryListCollection();
    await col.deleteMany({ householdId }, { session });
  },
};
