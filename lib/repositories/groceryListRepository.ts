import { ObjectId, ClientSession } from "mongodb";
import { groceryListCollection } from "@/lib/db/collections";
import {
  groceryListItemSchema,
  groceryListItemInputSchema,
  type GroceryListItem,
  type GroceryListItemInput,
} from "@/lib/schemas/groceryList";

export const groceryListRepository = {
  async findAllForUser(userId: ObjectId): Promise<GroceryListItem[]> {
    const col = await groceryListCollection();
    const docs = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => groceryListItemSchema.parse(d));
  },

  async findByIds(userId: ObjectId, ids: ObjectId[]): Promise<GroceryListItem[]> {
    const col = await groceryListCollection();
    const docs = await col.find({ userId, _id: { $in: ids } }).toArray();
    return docs.map((d) => groceryListItemSchema.parse(d));
  },

  // Same identity + unit already sitting unchecked on the list — used to
  // merge a duplicate add into the existing row's qty instead of stacking
  // a second row. Checked-off rows are excluded: "got it" shouldn't
  // silently absorb a fresh need.
  async findUnmergedMatch(
    userId: ObjectId,
    criteria: { userItemId: ObjectId | null; name: string; storeId: ObjectId | null; unit: string }
  ): Promise<GroceryListItem | null> {
    const col = await groceryListCollection();
    const doc = await col.findOne({
      userId,
      userItemId: criteria.userItemId,
      name: criteria.name,
      storeId: criteria.storeId,
      unit: criteria.unit,
      checked: false,
    });
    return doc ? groceryListItemSchema.parse(doc) : null;
  },

  async create(input: GroceryListItemInput): Promise<GroceryListItem> {
    const col = await groceryListCollection();
    const parsed = groceryListItemInputSchema.parse(input);
    const doc = { ...parsed, _id: new ObjectId(), createdAt: new Date() };
    await col.insertOne(doc);
    return groceryListItemSchema.parse(doc);
  },

  async setChecked(userId: ObjectId, id: ObjectId, checked: boolean): Promise<void> {
    const col = await groceryListCollection();
    await col.updateOne({ _id: id, userId }, { $set: { checked } });
  },

  async update(
    userId: ObjectId,
    id: ObjectId,
    patch: Partial<Pick<GroceryListItem, "qty" | "unit" | "storeId" | "name" | "category">>
  ): Promise<void> {
    const col = await groceryListCollection();
    await col.updateOne({ _id: id, userId }, { $set: patch });
  },

  async delete(userId: ObjectId, id: ObjectId): Promise<void> {
    const col = await groceryListCollection();
    await col.deleteOne({ _id: id, userId });
  },

  async deleteMany(userId: ObjectId, ids: ObjectId[], session?: ClientSession): Promise<void> {
    const col = await groceryListCollection();
    await col.deleteMany({ userId, _id: { $in: ids } }, { session });
  },
};
