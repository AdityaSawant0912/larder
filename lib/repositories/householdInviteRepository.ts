import { ObjectId } from "mongodb";
import { householdInvitesCollection } from "@/lib/db/collections";
import {
  householdInviteSchema,
  householdInviteInputSchema,
  type HouseholdInvite,
  type HouseholdInviteInput,
} from "@/lib/schemas/household";

export const householdInviteRepository = {
  async findActiveByHousehold(householdId: ObjectId): Promise<HouseholdInvite | null> {
    const col = await householdInvitesCollection();
    const doc = await col.findOne({ householdId, revoked: false });
    return doc ? householdInviteSchema.parse(doc) : null;
  },

  async findByToken(token: string): Promise<HouseholdInvite | null> {
    const col = await householdInvitesCollection();
    const doc = await col.findOne({ token, revoked: false });
    return doc ? householdInviteSchema.parse(doc) : null;
  },

  async create(input: HouseholdInviteInput): Promise<HouseholdInvite> {
    const col = await householdInvitesCollection();
    const parsed = householdInviteInputSchema.parse(input);
    const doc = { ...parsed, _id: new ObjectId(), createdAt: new Date() };
    await col.insertOne(doc);
    return householdInviteSchema.parse(doc);
  },

  async revoke(id: ObjectId): Promise<void> {
    const col = await householdInvitesCollection();
    await col.updateOne({ _id: id }, { $set: { revoked: true } });
  },

  async deleteAllForHousehold(householdId: ObjectId): Promise<void> {
    const col = await householdInvitesCollection();
    await col.deleteMany({ householdId });
  },
};
