import { ObjectId, ClientSession } from "mongodb";
import { withTransaction } from "@/lib/db/transaction";
import { userItemRepository } from "@/lib/repositories/userItemRepository";
import * as resolution from "@/lib/services/itemResolutionService";
import type { ItemSelection } from "@/lib/services/pantryService";
import type { Location } from "@/lib/schemas/shared";

export interface RestockQueueItem {
  selection: ItemSelection;
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
}

async function resolveWithinTransaction(
  userId: ObjectId,
  selection: ItemSelection,
  session: ClientSession
) {
  switch (selection.kind) {
    case "global":
      return resolution.resolveGlobalItem(userId, selection.globalItemId, session);
    case "userItem":
      return resolution.resolveExistingUserItem(userId, selection.userItemId);
    case "manual":
      return resolution.createManualItem(userId, selection.manual, session);
  }
}

// Commits the whole staging queue in one transaction (docs/04-architecture
// + docs/07-screens-mobile "Restock mode") — either the whole batch lands
// or none of it does.
export async function commitQueue(userId: ObjectId, queue: RestockQueueItem[]): Promise<void> {
  if (queue.length === 0) return;

  await withTransaction(async (session) => {
    for (const row of queue) {
      const item = await resolveWithinTransaction(userId, row.selection, session);
      await userItemRepository.addForm(
        userId,
        item._id,
        {
          unit: row.unit,
          qty: row.qty,
          location: row.location,
          shelfLifeDays: row.shelfLifeDays,
          note: row.note,
          addedDate: new Date(),
        },
        session
      );
    }
  });
}
