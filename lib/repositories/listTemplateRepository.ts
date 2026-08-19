import { ObjectId } from "mongodb";
import { listTemplatesCollection } from "@/lib/db/collections";
import {
  listTemplateSchema,
  listTemplateInputSchema,
  type ListTemplate,
  type ListTemplateInput,
} from "@/lib/schemas/listTemplate";

export const listTemplateRepository = {
  async findAllForUser(userId: ObjectId): Promise<ListTemplate[]> {
    const col = await listTemplatesCollection();
    const docs = await col.find({ userId }).toArray();
    return docs.map((d) => listTemplateSchema.parse(d));
  },

  async findById(userId: ObjectId, id: ObjectId): Promise<ListTemplate | null> {
    const col = await listTemplatesCollection();
    const doc = await col.findOne({ _id: id, userId });
    return doc ? listTemplateSchema.parse(doc) : null;
  },

  async create(input: ListTemplateInput): Promise<ListTemplate> {
    const col = await listTemplatesCollection();
    const parsed = listTemplateInputSchema.parse(input);
    const doc = { ...parsed, _id: new ObjectId() };
    await col.insertOne(doc);
    return listTemplateSchema.parse(doc);
  },

  async delete(userId: ObjectId, id: ObjectId): Promise<void> {
    const col = await listTemplatesCollection();
    await col.deleteOne({ _id: id, userId });
  },
};
