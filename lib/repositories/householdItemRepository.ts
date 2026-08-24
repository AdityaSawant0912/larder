import { ObjectId, ClientSession } from "mongodb";
import { householdItemsCollection } from "@/lib/db/collections";
import {
  householdItemSchema,
  householdItemInputSchema,
  type HouseholdItem,
  type HouseholdItemInput,
} from "@/lib/schemas/householdItem";
import { formSchema, type Form, type Threshold } from "@/lib/schemas/userItem";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Mirrors userItemRepository.ts, scoped by householdId instead of userId.
// updateForm/removeForm/consume/convert aren't needed yet (see plan) — add
// them here alongside Restock/Clear-Out for households if that gets asked for.
export const householdItemRepository = {
  async findAllForHousehold(householdId: ObjectId): Promise<HouseholdItem[]> {
    const col = await householdItemsCollection();
    const docs = await col.find({ householdId }).toArray();
    return docs.map((d) => householdItemSchema.parse(d));
  },

  async findById(householdId: ObjectId, id: ObjectId): Promise<HouseholdItem | null> {
    const col = await householdItemsCollection();
    const doc = await col.findOne({ _id: id, householdId });
    return doc ? householdItemSchema.parse(doc) : null;
  },

  async findByGlobalItemId(householdId: ObjectId, globalItemId: ObjectId): Promise<HouseholdItem | null> {
    const col = await householdItemsCollection();
    const doc = await col.findOne({ householdId, globalItemId });
    return doc ? householdItemSchema.parse(doc) : null;
  },

  // No Atlas Search index on this collection (not requested) — plain
  // case-insensitive contains match, only used to dedupe within one
  // household's already-added items.
  async searchByName(householdId: ObjectId, query: string): Promise<HouseholdItem[]> {
    const col = await householdItemsCollection();
    const docs = await col
      .find({ householdId, name: { $regex: query, $options: "i" } })
      .limit(20)
      .toArray();
    return docs.map((d) => householdItemSchema.parse(d));
  },

  async create(input: HouseholdItemInput, session?: ClientSession): Promise<HouseholdItem> {
    const col = await householdItemsCollection();
    const parsed = householdItemInputSchema.parse(input);
    const now = new Date();
    const doc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now };
    await col.insertOne(doc, { session });
    return householdItemSchema.parse(doc);
  },

  async updateDefaults(
    householdId: ObjectId,
    id: ObjectId,
    patch: Partial<
      Pick<HouseholdItem, "name" | "category" | "defaultUnit" | "defaultShelfLifeDays" | "defaultLocation">
    >
  ): Promise<void> {
    const col = await householdItemsCollection();
    await col.updateOne(
      { _id: id, householdId },
      { $set: { ...patch, updatedAt: new Date() } }
    );
  },

  async setThresholds(householdId: ObjectId, id: ObjectId, thresholds: Threshold[]): Promise<void> {
    const col = await householdItemsCollection();
    await col.updateOne(
      { _id: id, householdId },
      { $set: { thresholds, updatedAt: new Date() } }
    );
  },

  async delete(householdId: ObjectId, id: ObjectId): Promise<void> {
    const col = await householdItemsCollection();
    await col.deleteOne({ _id: id, householdId });
  },

  async deleteAllForHousehold(householdId: ObjectId, session?: ClientSession): Promise<void> {
    const col = await householdItemsCollection();
    await col.deleteMany({ householdId }, { session });
  },

  // Same same-day/unit/location/shelfLife merge as userItemRepository.addForm.
  async addForm(
    householdId: ObjectId,
    itemId: ObjectId,
    form: Omit<Form, "id">,
    session?: ClientSession
  ): Promise<Form> {
    const col = await householdItemsCollection();
    const parsed = formSchema.parse({ ...form, id: new ObjectId() });

    const doc = await col.findOne({ _id: itemId, householdId }, { session });
    const existing = doc?.forms.find(
      (f) =>
        f.unit === parsed.unit &&
        f.location === parsed.location &&
        f.shelfLifeDays === parsed.shelfLifeDays &&
        Math.floor((parsed.addedDate.getTime() - f.addedDate.getTime()) / MS_PER_DAY) === 0
    );

    if (existing) {
      const merged = { ...existing, qty: existing.qty + parsed.qty };
      await col.updateOne(
        { _id: itemId, householdId, "forms.id": existing.id },
        { $set: { "forms.$.qty": merged.qty, updatedAt: new Date() } },
        { session }
      );
      return merged;
    }

    await col.updateOne(
      { _id: itemId, householdId },
      { $push: { forms: parsed }, $set: { updatedAt: new Date() } },
      { session }
    );
    return parsed;
  },
};
