import { ObjectId } from "mongodb";
import { userItemRepository } from "@/lib/repositories/userItemRepository";
import * as resolution from "@/lib/services/itemResolutionService";
import type { UserItem, Form } from "@/lib/schemas/userItem";
import type { Location } from "@/lib/schemas/shared";

// Home only renders items with at least one live form (docs/07) — zero-
// stock items stay in the catalog but never appear here.
export async function listCurrentPantry(userId: ObjectId): Promise<UserItem[]> {
  const items = await userItemRepository.findAllForUser(userId);
  return items.filter((item) => item.forms.length > 0);
}

export interface AddFormInput {
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
  saveAsDefault?: boolean;
}

export type ItemSelection =
  | { kind: "global"; globalItemId: ObjectId }
  | { kind: "userItem"; userItemId: ObjectId }
  | { kind: "manual"; manual: resolution.ManualItemInput };

// The single "resolve then add a form" path shared by Home's normal add
// and Restock's per-row add-to-queue (docs/03-resolution-flows.md step 4).
export async function resolveAndAddForm(
  userId: ObjectId,
  selection: ItemSelection,
  input: AddFormInput
): Promise<{ item: UserItem; form: Form }> {
  const userItem = await resolveSelection(userId, selection);

  if (input.saveAsDefault) {
    await userItemRepository.updateDefaults(userId, userItem._id, {
      defaultUnit: input.unit,
      defaultLocation: input.location,
      defaultShelfLifeDays: input.shelfLifeDays,
    });
  }

  const form = await userItemRepository.addForm(userId, userItem._id, {
    unit: input.unit,
    qty: input.qty,
    location: input.location,
    shelfLifeDays: input.shelfLifeDays,
    note: input.note,
    addedDate: new Date(),
  });

  return { item: userItem, form };
}

export async function resolveSelection(userId: ObjectId, selection: ItemSelection): Promise<UserItem> {
  switch (selection.kind) {
    case "global":
      return resolution.resolveGlobalItem(userId, selection.globalItemId);
    case "userItem":
      return resolution.resolveExistingUserItem(userId, selection.userItemId);
    case "manual":
      return resolution.createManualItem(userId, selection.manual);
  }
}

// Consume reduces qty in place; hitting zero removes the form entirely
// (the item identity persists per the schema decision, only the form
// goes away).
export async function consumeForm(
  userId: ObjectId,
  itemId: ObjectId,
  formId: ObjectId,
  consumedQty: number
): Promise<void> {
  const item = await userItemRepository.findById(userId, itemId);
  if (!item) throw new Error("Item not found");
  const form = item.forms.find((f) => f.id.equals(formId));
  if (!form) throw new Error("Form not found");

  const remaining = form.qty - consumedQty;
  if (remaining <= 0) {
    await userItemRepository.removeForm(userId, itemId, formId);
  } else {
    await userItemRepository.updateForm(userId, itemId, formId, { qty: remaining });
  }
}

export interface ConvertOutput {
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
}

// e.g. 1 whole watermelon -> 4 containers: removes the source form,
// appends the resulting output forms. Single document, so this is
// already atomic without a transaction.
export async function convertForm(
  userId: ObjectId,
  itemId: ObjectId,
  formId: ObjectId,
  outputs: ConvertOutput[]
): Promise<void> {
  await userItemRepository.removeForm(userId, itemId, formId);
  for (const output of outputs) {
    await userItemRepository.addForm(userId, itemId, {
      ...output,
      addedDate: new Date(),
    });
  }
}

export async function deleteForm(userId: ObjectId, itemId: ObjectId, formId: ObjectId): Promise<void> {
  await userItemRepository.removeForm(userId, itemId, formId);
}
