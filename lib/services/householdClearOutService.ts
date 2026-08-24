import { ObjectId } from "mongodb";
import { withTransaction } from "@/lib/db/transaction";
import { householdItemRepository } from "@/lib/repositories/householdItemRepository";

export interface HouseholdClearOutSelection {
  itemId: ObjectId;
  formId: ObjectId;
}

// Mirrors clearOutService.ts's discardSelected, scoped by householdId.
export async function discardSelected(householdId: ObjectId, selections: HouseholdClearOutSelection[]): Promise<void> {
  if (selections.length === 0) return;

  await withTransaction(async (session) => {
    for (const { itemId, formId } of selections) {
      await householdItemRepository.removeForm(householdId, itemId, formId, session);
    }
  });
}
