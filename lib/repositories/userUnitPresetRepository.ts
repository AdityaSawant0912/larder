import { ObjectId } from "mongodb";
import { userUnitPresetsCollection } from "@/lib/db/collections";
import { userUnitPresetSchema, type UserUnitPreset } from "@/lib/schemas/userUnitPreset";

export const userUnitPresetRepository = {
  async findForCategory(userId: ObjectId, category: string): Promise<UserUnitPreset | null> {
    const col = await userUnitPresetsCollection();
    const doc = await col.findOne({ userId, category });
    return doc ? userUnitPresetSchema.parse(doc) : null;
  },

  async findAllForUser(userId: ObjectId): Promise<UserUnitPreset[]> {
    const col = await userUnitPresetsCollection();
    const docs = await col.find({ userId }).toArray();
    return docs.map((d) => userUnitPresetSchema.parse(d));
  },

  // Learns a new unit typed via "Other →" — upserts and $addToSet so
  // repeats don't duplicate.
  async learnUnit(userId: ObjectId, category: string, unit: string): Promise<void> {
    const col = await userUnitPresetsCollection();
    await col.updateOne(
      { userId, category },
      { $addToSet: { units: unit }, $setOnInsert: { _id: new ObjectId() } },
      { upsert: true }
    );
  },

  // Settings > User Units delete — drops the category doc entirely once
  // its last learned unit is removed rather than leaving an empty row.
  async removeUnit(userId: ObjectId, category: string, unit: string): Promise<void> {
    const col = await userUnitPresetsCollection();
    await col.updateOne({ userId, category }, { $pull: { units: unit } });
    await col.deleteOne({ userId, category, units: { $size: 0 } });
  },
};
