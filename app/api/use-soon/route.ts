import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { listCurrentPantry } from "@/lib/services/pantryService";
import { daysLeft } from "@/lib/domain/freshness";

// Cross-location, sorted strictly by days-left worst first
// (docs/07-screens-mobile "Use-soon").
export async function GET() {
  try {
    const userId = new ObjectId(await requireUserId());
    const items = await listCurrentPantry(userId);

    const rows = items.flatMap((item) =>
      item.forms.map((form) => ({
        itemId: item._id,
        itemName: item.name,
        formId: form.id,
        unit: form.unit,
        qty: form.qty,
        location: form.location,
        daysLeft: daysLeft(form.addedDate, form.shelfLifeDays),
      }))
    );

    rows.sort((a, b) => a.daysLeft - b.daysLeft);
    return NextResponse.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}
