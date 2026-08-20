import { ObjectId, ClientSession } from "mongodb";
import { withTransaction } from "@/lib/db/transaction";
import { groceryListRepository } from "@/lib/repositories/groceryListRepository";
import { userItemRepository } from "@/lib/repositories/userItemRepository";
import * as resolution from "@/lib/services/itemResolutionService";
import type { GroceryListItem } from "@/lib/schemas/groceryList";
import type { Location } from "@/lib/schemas/shared";

export async function listForUser(userId: ObjectId): Promise<GroceryListItem[]> {
  return groceryListRepository.findAllForUser(userId);
}

export type GroceryAddSelection =
  | { kind: "global"; globalItemId: ObjectId }
  | { kind: "userItem"; userItemId: ObjectId }
  | { kind: "freeText"; name: string; category: string };

export interface AddGroceryItemInput {
  selection: GroceryAddSelection;
  qty: number;
  unit: string;
  storeId: ObjectId | null;
}

// Same catalog resolution as pantry adds when a catalog match is picked;
// a raw free-text row (no catalog entry) is also allowed since a grocery
// list row doesn't need shelf-life/location to be useful (docs/03).
export async function addItem(userId: ObjectId, input: AddGroceryItemInput): Promise<GroceryListItem> {
  let userItemId: ObjectId | null = null;
  let name: string;
  let category: string;

  if (input.selection.kind === "global") {
    const item = await resolution.resolveGlobalItem(userId, input.selection.globalItemId);
    userItemId = item._id;
    name = item.name;
    category = item.category;
  } else if (input.selection.kind === "userItem") {
    const item = await resolution.resolveExistingUserItem(userId, input.selection.userItemId);
    userItemId = item._id;
    name = item.name;
    category = item.category;
  } else {
    name = input.selection.name;
    category = input.selection.category;
  }

  const existing = await groceryListRepository.findUnmergedMatch(userId, {
    userItemId,
    name,
    storeId: input.storeId,
    unit: input.unit,
  });

  if (existing) {
    const qty = existing.qty + input.qty;
    await groceryListRepository.update(userId, existing._id, { qty });
    return { ...existing, qty };
  }

  return groceryListRepository.create({
    userId,
    userItemId,
    name,
    category,
    storeId: input.storeId,
    qty: input.qty,
    unit: input.unit,
    checked: false,
  });
}

export async function toggleChecked(userId: ObjectId, id: ObjectId, checked: boolean): Promise<void> {
  await groceryListRepository.setChecked(userId, id, checked);
}

export async function deleteItem(userId: ObjectId, id: ObjectId): Promise<void> {
  await groceryListRepository.delete(userId, id);
}

export interface BulkAddRow {
  groceryListItemId: ObjectId;
  // Only needed when the row has no linked userItem yet.
  location?: Location;
  shelfLifeDays?: number;
}

// Review mode's "Add all to pantry" — same staging-queue-commit mechanic
// as Restock (docs/07-screens-mobile "Grocery List"): one transaction,
// each row lands in the pantry and is removed from the list.
export async function addAllToPantry(userId: ObjectId, rows: BulkAddRow[]): Promise<void> {
  if (rows.length === 0) return;

  await withTransaction(async (session) => {
    const listItems = await groceryListRepository.findByIds(
      userId,
      rows.map((r) => r.groceryListItemId)
    );
    const rowsById = new Map(rows.map((r) => [r.groceryListItemId.toHexString(), r]));

    for (const listItem of listItems) {
      const row = rowsById.get(listItem._id.toHexString());
      const userItem = listItem.userItemId
        ? await resolution.resolveExistingUserItem(userId, listItem.userItemId)
        : await resolution.createManualItem(
            userId,
            {
              name: listItem.name,
              category: listItem.category,
              defaultUnit: listItem.unit,
              defaultShelfLifeDays: row?.shelfLifeDays ?? 7,
              defaultLocation: row?.location ?? "pantry",
            },
            session
          );

      await userItemRepository.addForm(
        userId,
        userItem._id,
        {
          unit: listItem.unit,
          qty: listItem.qty,
          location: row?.location ?? userItem.defaultLocation,
          shelfLifeDays: row?.shelfLifeDays ?? userItem.defaultShelfLifeDays,
          addedDate: new Date(),
        },
        session
      );
    }

    await groceryListRepository.deleteMany(
      userId,
      listItems.map((i) => i._id),
      session
    );
  });
}
