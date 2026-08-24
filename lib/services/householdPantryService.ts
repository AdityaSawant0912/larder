import { ObjectId } from "mongodb";
import { householdItemRepository } from "@/lib/repositories/householdItemRepository";
import * as resolution from "@/lib/services/householdItemResolutionService";
import { matchCleanFraction } from "@/lib/domain/fractions";
import type { HouseholdItem } from "@/lib/schemas/householdItem";
import type { Form } from "@/lib/schemas/userItem";
import type { Location } from "@/lib/schemas/shared";

const EPSILON = 1e-9;

// Mirrors pantryService.ts, scoped by householdId.
export async function listCurrentHousehold(householdId: ObjectId): Promise<HouseholdItem[]> {
  const items = await householdItemRepository.findAllForHousehold(householdId);
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

export type HouseholdItemSelection =
  | { kind: "global"; globalItemId: ObjectId }
  | { kind: "householdItem"; householdItemId: ObjectId }
  | { kind: "manual"; manual: resolution.ManualHouseholdItemInput };

export async function resolveAndAddForm(
  householdId: ObjectId,
  addedByUserId: ObjectId,
  selection: HouseholdItemSelection,
  input: AddFormInput
): Promise<{ item: HouseholdItem; form: Form }> {
  const item = await resolveSelection(householdId, addedByUserId, selection);

  if (input.saveAsDefault) {
    await householdItemRepository.updateDefaults(householdId, item._id, {
      defaultUnit: input.unit,
      defaultLocation: input.location,
      defaultShelfLifeDays: input.shelfLifeDays,
    });
  }

  const form = await householdItemRepository.addForm(householdId, item._id, {
    unit: input.unit,
    qty: input.qty,
    location: input.location,
    shelfLifeDays: input.shelfLifeDays,
    note: input.note,
    addedDate: new Date(),
  });

  return { item, form };
}

async function resolveSelection(
  householdId: ObjectId,
  addedByUserId: ObjectId,
  selection: HouseholdItemSelection
): Promise<HouseholdItem> {
  switch (selection.kind) {
    case "global":
      return resolution.resolveGlobalItemForHousehold(householdId, addedByUserId, selection.globalItemId);
    case "householdItem":
      return resolution.resolveExistingHouseholdItem(householdId, selection.householdItemId);
    case "manual":
      return resolution.createManualHouseholdItem(householdId, addedByUserId, selection.manual);
  }
}

// Mirrors pantryService.ts's consumeForm/convertForm/deleteForm exactly,
// scoped by householdId — same clean-fraction auto-split behavior.
export async function consumeForm(
  householdId: ObjectId,
  itemId: ObjectId,
  formId: ObjectId,
  consumedQty: number
): Promise<void> {
  const item = await householdItemRepository.findById(householdId, itemId);
  if (!item) throw new Error("Item not found");
  const form = item.forms.find((f) => f.id.equals(formId));
  if (!form) throw new Error("Form not found");
  if (consumedQty > form.qty + EPSILON) throw new Error("Can't consume more than what's left");

  const whole = Math.floor(consumedQty);
  const frac = consumedQty - whole;
  const fraction = frac > EPSILON ? matchCleanFraction(frac) : null;

  const unitsExtracted = fraction ? whole + 1 : consumedQty;
  const remaining = form.qty - unitsExtracted;
  if (remaining <= EPSILON) {
    await householdItemRepository.removeForm(householdId, itemId, formId);
  } else {
    await householdItemRepository.updateForm(householdId, itemId, formId, { qty: remaining });
  }

  if (fraction) {
    await householdItemRepository.addForm(householdId, itemId, {
      unit: fraction.unit,
      qty: fraction.piecesRemaining,
      location: form.location,
      shelfLifeDays: form.shelfLifeDays,
      addedDate: new Date(),
    });
  }
}

export interface ConvertOutput {
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
}

export async function convertForm(
  householdId: ObjectId,
  itemId: ObjectId,
  formId: ObjectId,
  convertQty: number,
  outputs: ConvertOutput[]
): Promise<void> {
  const item = await householdItemRepository.findById(householdId, itemId);
  if (!item) throw new Error("Item not found");
  const form = item.forms.find((f) => f.id.equals(formId));
  if (!form) throw new Error("Form not found");
  if (convertQty > form.qty + EPSILON) throw new Error("Can't convert more than what's left");

  const remaining = form.qty - convertQty;
  if (remaining <= EPSILON) {
    await householdItemRepository.removeForm(householdId, itemId, formId);
  } else {
    await householdItemRepository.updateForm(householdId, itemId, formId, { qty: remaining });
  }

  for (const output of outputs) {
    await householdItemRepository.addForm(householdId, itemId, {
      ...output,
      addedDate: new Date(),
    });
  }
}

export async function deleteForm(householdId: ObjectId, itemId: ObjectId, formId: ObjectId): Promise<void> {
  await householdItemRepository.removeForm(householdId, itemId, formId);
}
