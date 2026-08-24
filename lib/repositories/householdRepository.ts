import { ObjectId } from "mongodb";
import { householdsCollection } from "@/lib/db/collections";
import {
  householdSchema,
  householdInputSchema,
  type Household,
  type HouseholdInput,
} from "@/lib/schemas/household";

export const householdRepository = {
  async findAllForUser(userId: ObjectId): Promise<Household[]> {
    const col = await householdsCollection();
    const docs = await col.find({ memberIds: userId }).toArray();
    return docs.map((d) => householdSchema.parse(d));
  },

  async findById(id: ObjectId): Promise<Household | null> {
    const col = await householdsCollection();
    const doc = await col.findOne({ _id: id });
    return doc ? householdSchema.parse(doc) : null;
  },

  async create(input: HouseholdInput): Promise<Household> {
    const col = await householdsCollection();
    const parsed = householdInputSchema.parse(input);
    const doc = { ...parsed, _id: new ObjectId(), createdAt: new Date() };
    await col.insertOne(doc);
    return householdSchema.parse(doc);
  },

  async addMember(id: ObjectId, userId: ObjectId): Promise<void> {
    const col = await householdsCollection();
    await col.updateOne({ _id: id }, { $addToSet: { memberIds: userId } });
  },

  async removeMember(id: ObjectId, userId: ObjectId): Promise<void> {
    const col = await householdsCollection();
    await col.updateOne({ _id: id }, { $pull: { memberIds: userId } });
  },

  async delete(id: ObjectId): Promise<void> {
    const col = await householdsCollection();
    await col.deleteOne({ _id: id });
  },
};
