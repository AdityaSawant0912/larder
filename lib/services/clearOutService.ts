import { ObjectId } from "mongodb";
import { withTransaction } from "@/lib/db/transaction";
import { userItemRepository } from "@/lib/repositories/userItemRepository";

export interface ClearOutSelection {
  itemId: ObjectId;
  formId: ObjectId;
}

// Discards N selected form rows across potentially many userItems docs in
// one transaction (docs/04-architecture + docs/07 "Clear-Out mode"). No
// waste-log side effect in v1 (deferred to docs/09-v2-roadmap.md).
export async function discardSelected(userId: ObjectId, selections: ClearOutSelection[]): Promise<void> {
  if (selections.length === 0) return;

  await withTransaction(async (session) => {
    for (const { itemId, formId } of selections) {
      await userItemRepository.removeForm(userId, itemId, formId, session);
    }
  });
}
