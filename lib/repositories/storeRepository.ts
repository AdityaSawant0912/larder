import { ObjectId } from "mongodb";
import { userStoresCollection, globalStoresCollection } from "@/lib/db/collections";
import {
  userStoreSchema,
  globalStoreSchema,
  type UserStore,
  type UserStoreInput,
  type GlobalStore,
  type GlobalStoreInput,
} from "@/lib/schemas/store";

export const globalStoreRepository = {
  async findById(id: ObjectId): Promise<GlobalStore | null> {
    const col = await globalStoresCollection();
    const doc = await col.findOne({ _id: id });
    return doc ? globalStoreSchema.parse(doc) : null;
  },

  async searchByName(query: string): Promise<GlobalStore[]> {
    const col = await globalStoresCollection();
    const docs = await col
      .find({ name: { $regex: query, $options: "i" } })
      .limit(20)
      .toArray();
    return docs.map((d) => globalStoreSchema.parse(d));
  },

  async create(input: GlobalStoreInput): Promise<GlobalStore> {
    const col = await globalStoresCollection();
    const doc = { ...input, _id: new ObjectId() };
    await col.insertOne(doc);
    return globalStoreSchema.parse(doc);
  },
};

export const userStoreRepository = {
  async findAllForUser(userId: ObjectId): Promise<UserStore[]> {
    const col = await userStoresCollection();
    const docs = await col.find({ userId }).toArray();
    return docs.map((d) => userStoreSchema.parse(d));
  },

  async findByGlobalStoreId(userId: ObjectId, globalStoreId: ObjectId): Promise<UserStore | null> {
    const col = await userStoresCollection();
    const doc = await col.findOne({ userId, globalStoreId });
    return doc ? userStoreSchema.parse(doc) : null;
  },

  async searchByName(userId: ObjectId, query: string): Promise<UserStore[]> {
    const col = await userStoresCollection();
    const docs = await col
      .find({ userId, name: { $regex: query, $options: "i" } })
      .limit(20)
      .toArray();
    return docs.map((d) => userStoreSchema.parse(d));
  },

  async create(input: UserStoreInput): Promise<UserStore> {
    const col = await userStoresCollection();
    const doc = { ...input, _id: new ObjectId() };
    await col.insertOne(doc);
    return userStoreSchema.parse(doc);
  },
};
