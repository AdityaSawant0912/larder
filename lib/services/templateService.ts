import { ObjectId } from "mongodb";
import { listTemplateRepository } from "@/lib/repositories/listTemplateRepository";
import { groceryListRepository } from "@/lib/repositories/groceryListRepository";
import type { ListTemplate, TemplateItem } from "@/lib/schemas/listTemplate";

export async function listTemplatesForUser(userId: ObjectId): Promise<ListTemplate[]> {
  return listTemplateRepository.findAllForUser(userId);
}

export async function createTemplate(
  userId: ObjectId,
  name: string,
  items: TemplateItem[]
): Promise<ListTemplate> {
  return listTemplateRepository.create({ userId, name, items });
}

export async function deleteTemplate(userId: ObjectId, id: ObjectId): Promise<void> {
  await listTemplateRepository.delete(userId, id);
}

// Drops a saved "usual order" straight into a new grocery list in one
// action (docs/01 "Repeat-list / templates").
export async function applyTemplate(userId: ObjectId, templateId: ObjectId): Promise<void> {
  const template = await listTemplateRepository.findById(userId, templateId);
  if (!template) throw new Error("Template not found");

  for (const item of template.items) {
    await groceryListRepository.create({
      userId,
      userItemId: null,
      name: item.name,
      category: item.category,
      storeId: item.storeId,
      qty: item.qty,
      unit: item.unit,
      checked: false,
    });
  }
}
