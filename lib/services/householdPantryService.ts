import { ObjectId } from "mongodb";
import { householdItemRepository } from "@/lib/repositories/householdItemRepository";
import * as resolution from "@/lib/services/householdItemResolutionService";
import type { HouseholdItem } from "@/lib/schemas/householdItem";
import type { Form } from "@/lib/schemas/userItem";
import type { Location } from "@/lib/schemas/shared";

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
