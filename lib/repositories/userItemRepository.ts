import { ObjectId, ClientSession } from "mongodb";
import { userItemsCollection } from "@/lib/db/collections";
import { nameSearchStage } from "@/lib/db/search";
import {
  userItemSchema,
  userItemInputSchema,
  formSchema,
  type UserItem,
  type UserItemInput,
  type Form,
  type Threshold,
} from "@/lib/schemas/userItem";

export const userItemRepository = {
  async findAllForUser(userId: ObjectId): Promise<UserItem[]> {
    const col = await userItemsCollection();
    const docs = await col.find({ userId }).toArray();
    return docs.map((d) => userItemSchema.parse(d));
  },

  async findById(userId: ObjectId, id: ObjectId): Promise<UserItem | null> {
    const col = await userItemsCollection();
    const doc = await col.findOne({ _id: id, userId });
    return doc ? userItemSchema.parse(doc) : null;
  },

  async findByGlobalItemId(userId: ObjectId, globalItemId: ObjectId): Promise<UserItem | null> {
    const col = await userItemsCollection();
    const doc = await col.findOne({ userId, globalItemId });
    return doc ? userItemSchema.parse(doc) : null;
  },

  async searchByName(userId: ObjectId, query: string): Promise<UserItem[]> {
    const col = await userItemsCollection();
    const docs = await col
      .aggregate([nameSearchStage(query, { userId }), { $limit: 20 }])
      .toArray();
    return docs.map((d) => userItemSchema.parse(d));
  },

  async create(input: UserItemInput, session?: ClientSession): Promise<UserItem> {
    const col = await userItemsCollection();
    const parsed = userItemInputSchema.parse(input);
    const now = new Date();
    const doc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now };
    await col.insertOne(doc, { session });
    return userItemSchema.parse(doc);
  },

  async updateDefaults(
    userId: ObjectId,
    id: ObjectId,
    patch: Partial<
      Pick<
        UserItem,
        "name" | "category" | "defaultUnit" | "defaultShelfLifeDays" | "defaultLocation"
      >
    >
  ): Promise<void> {
    const col = await userItemsCollection();
    await col.updateOne(
      { _id: id, userId },
      { $set: { ...patch, updatedAt: new Date() } }
    );
  },

  async setThresholds(userId: ObjectId, id: ObjectId, thresholds: Threshold[]): Promise<void> {
    const col = await userItemsCollection();
    await col.updateOne(
      { _id: id, userId },
      { $set: { thresholds, updatedAt: new Date() } }
    );
  },

  async addForm(
    userId: ObjectId,
    itemId: ObjectId,
    form: Omit<Form, "id">,
    session?: ClientSession
  ): Promise<Form> {
    const col = await userItemsCollection();
    const parsed = formSchema.parse({ ...form, id: new ObjectId() });
    await col.updateOne(
      { _id: itemId, userId },
      { $push: { forms: parsed }, $set: { updatedAt: new Date() } },
      { session }
    );
    return parsed;
  },

  async updateForm(
    userId: ObjectId,
    itemId: ObjectId,
    formId: ObjectId,
    patch: Partial<Pick<Form, "unit" | "qty" | "note" | "location">>
  ): Promise<void> {
    const col = await userItemsCollection();
    const setFields: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(patch)) {
      setFields[`forms.$.${key}`] = value;
    }
    await col.updateOne({ _id: itemId, userId, "forms.id": formId }, { $set: setFields });
  },

  async removeForm(
    userId: ObjectId,
    itemId: ObjectId,
    formId: ObjectId,
    session?: ClientSession
  ): Promise<void> {
    const col = await userItemsCollection();
    await col.updateOne(
      { _id: itemId, userId },
      { $pull: { forms: { id: formId } }, $set: { updatedAt: new Date() } },
      { session }
    );
  },
};
