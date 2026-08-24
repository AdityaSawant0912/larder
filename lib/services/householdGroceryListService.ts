import { ObjectId } from "mongodb";
import { withTransaction } from "@/lib/db/transaction";
import { householdGroceryListRepository } from "@/lib/repositories/householdGroceryListRepository";
import { householdItemRepository } from "@/lib/repositories/householdItemRepository";
import * as resolution from "@/lib/services/householdItemResolutionService";
import type { HouseholdGroceryListItem } from "@/lib/schemas/householdGroceryList";
import type { Location } from "@/lib/schemas/shared";

// Mirrors groceryListService.ts, scoped by householdId. No storeId — see
// householdGroceryList.ts schema comment.
export async function listForHousehold(householdId: ObjectId): Promise<HouseholdGroceryListItem[]> {
  return householdGroceryListRepository.findAllForHousehold(householdId);
}

export type HouseholdGroceryAddSelection =
  | { kind: "global"; globalItemId: ObjectId }
  | { kind: "householdItem"; householdItemId: ObjectId }
  | { kind: "freeText"; name: string; category: string };

export interface AddHouseholdGroceryItemInput {
  selection: HouseholdGroceryAddSelection;
  qty: number;
  unit: string;
}

export async function addItem(
  householdId: ObjectId,
  addedByUserId: ObjectId,
  input: AddHouseholdGroceryItemInput
): Promise<HouseholdGroceryListItem> {
  let householdItemId: ObjectId | null = null;
  let name: string;
  let category: string;

  if (input.selection.kind === "global") {
    const item = await resolution.resolveGlobalItemForHousehold(
      householdId,
      addedByUserId,
      input.selection.globalItemId
    );
    householdItemId = item._id;
    name = item.name;
    category = item.category;
  } else if (input.selection.kind === "householdItem") {
    const item = await resolution.resolveExistingHouseholdItem(householdId, input.selection.householdItemId);
    householdItemId = item._id;
    name = item.name;
    category = item.category;
  } else {
    name = input.selection.name;
    category = input.selection.category;
  }

  const existing = await householdGroceryListRepository.findUnmergedMatch(householdId, {
    householdItemId,
    name,
    unit: input.unit,
  });

  if (existing) {
    const qty = existing.qty + input.qty;
    await householdGroceryListRepository.update(householdId, existing._id, { qty });
    return { ...existing, qty };
  }

  return householdGroceryListRepository.create({
    householdId,
    addedByUserId,
    householdItemId,
    name,
    category,
    qty: input.qty,
    unit: input.unit,
    checked: false,
  });
}

export async function toggleChecked(householdId: ObjectId, id: ObjectId, checked: boolean): Promise<void> {
  await householdGroceryListRepository.setChecked(householdId, id, checked);
}

export async function deleteItem(householdId: ObjectId, id: ObjectId): Promise<void> {
  await householdGroceryListRepository.delete(householdId, id);
}

export interface HouseholdBulkAddRow {
  groceryListItemId: ObjectId;
  location?: Location;
  shelfLifeDays?: number;
}

// "Add all to pantry" for the household list — lands in householdItems,
// visible to every member (mirrors groceryListService.addAllToPantry).
export async function addAllToPantry(
  householdId: ObjectId,
  addedByUserId: ObjectId,
  rows: HouseholdBulkAddRow[]
): Promise<void> {
  if (rows.length === 0) return;

  await withTransaction(async (session) => {
    const listItems = await householdGroceryListRepository.findByIds(
      householdId,
      rows.map((r) => r.groceryListItemId)
    );
    const rowsById = new Map(rows.map((r) => [r.groceryListItemId.toHexString(), r]));

    for (const listItem of listItems) {
      const row = rowsById.get(listItem._id.toHexString());
      const item = listItem.householdItemId
        ? await resolution.resolveExistingHouseholdItem(householdId, listItem.householdItemId)
        : await resolution.createManualHouseholdItem(
            householdId,
            addedByUserId,
            {
              name: listItem.name,
              category: listItem.category,
              defaultUnit: listItem.unit,
              defaultShelfLifeDays: row?.shelfLifeDays ?? 7,
              defaultLocation: row?.location ?? "pantry",
            },
            session
          );

      await householdItemRepository.addForm(
        householdId,
        item._id,
        {
          unit: listItem.unit,
          qty: listItem.qty,
          location: row?.location ?? item.defaultLocation,
          shelfLifeDays: row?.shelfLifeDays ?? item.defaultShelfLifeDays,
          addedDate: new Date(),
        },
        session
      );
    }

    await householdGroceryListRepository.deleteMany(
      householdId,
      listItems.map((i) => i._id),
      session
    );
  });
}
