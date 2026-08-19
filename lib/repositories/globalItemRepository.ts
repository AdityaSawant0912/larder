import { ObjectId } from "mongodb";
import { globalItemsCollection } from "@/lib/db/collections";
import { nameSearchStage } from "@/lib/db/search";
import { globalItemSchema, type GlobalItem, type GlobalItemInput } from "@/lib/schemas/globalItem";

export const globalItemRepository = {
  async searchByName(query: string): Promise<GlobalItem[]> {
    const col = await globalItemsCollection();
    const docs = await col
      .aggregate([nameSearchStage(query), { $match: { status: "active" } }, { $limit: 20 }])
      .toArray();
    return docs.map((d) => globalItemSchema.parse(d));
  },

  async findById(id: ObjectId): Promise<GlobalItem | null> {
    const col = await globalItemsCollection();
    const doc = await col.findOne({ _id: id });
    return doc ? globalItemSchema.parse(doc) : null;
  },

  async create(input: GlobalItemInput): Promise<GlobalItem> {
    const col = await globalItemsCollection();
    const doc = { ...input, _id: new ObjectId(), createdAt: new Date() };
    await col.insertOne(doc);
    return globalItemSchema.parse(doc);
  },
};
