// Populates the demo showcase account with realistic pantry/grocery/
// template data for landing-page screenshots. Sign the account up through
// the real app UI first (this script only looks its userId up by email —
// better-auth owns account creation, no reason to reimplement it here) —
// see the demo credentials below, then:
//   npm run seed:demo
// Idempotent: no-ops if the account already has pantry items.
import { config } from "dotenv";
config({ path: ".env.local" });

import { ObjectId } from "mongodb";
import { getDb } from "../lib/db/connection";
import { userItemRepository } from "../lib/repositories/userItemRepository";
import * as resolution from "../lib/services/itemResolutionService";
import * as groceryListService from "../lib/services/groceryListService";
import * as templateService from "../lib/services/templateService";
import type { ManualItemInput } from "../lib/services/itemResolutionService";
import type { Location } from "../lib/schemas/shared";

export const DEMO_EMAIL = "demo.showcase2@larder.app";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface SeedForm {
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  daysAgo: number;
}

interface SeedItem {
  manual: ManualItemInput;
  forms: SeedForm[];
}

// shelfLifeDays - daysAgo = days left, which drives the freshness gauge
// (<=2 danger, <=5 warning, else fresh) — chosen for a mix of all three.
const ITEMS: SeedItem[] = [
  {
    manual: { name: "Milk", category: "dairy", defaultUnit: "bottle", defaultShelfLifeDays: 7, defaultLocation: "fridge" },
    forms: [{ unit: "bottle", qty: 1, location: "fridge", shelfLifeDays: 7, daysAgo: 5 }], // danger
  },
  {
    manual: { name: "Eggs", category: "eggs", defaultUnit: "dozen", defaultShelfLifeDays: 21, defaultLocation: "fridge" },
    forms: [{ unit: "dozen", qty: 1, location: "fridge", shelfLifeDays: 21, daysAgo: 10 }], // fresh
  },
  {
    manual: { name: "Spinach", category: "produce", defaultUnit: "bag", defaultShelfLifeDays: 6, defaultLocation: "fridge" },
    forms: [{ unit: "bag", qty: 1, location: "fridge", shelfLifeDays: 6, daysAgo: 4 }], // danger
  },
  {
    // The convert story: one watermelon cut into containers, one still whole.
    manual: { name: "Watermelon", category: "produce", defaultUnit: "whole", defaultShelfLifeDays: 10, defaultLocation: "fridge" },
    forms: [
      { unit: "whole", qty: 1, location: "fridge", shelfLifeDays: 10, daysAgo: 1 }, // fresh
      { unit: "container", qty: 4, location: "fridge", shelfLifeDays: 5, daysAgo: 0 }, // warning
    ],
  },
  {
    // The fraction-consume story: a bag plus a leftover "half" from a
    // decimal consume (see lib/domain/fractions.ts).
    manual: { name: "Potatoes", category: "produce", defaultUnit: "bag", defaultShelfLifeDays: 30, defaultLocation: "pantry" },
    forms: [
      { unit: "bag", qty: 1, location: "pantry", shelfLifeDays: 30, daysAgo: 10 }, // fresh
      { unit: "half", qty: 1, location: "pantry", shelfLifeDays: 30, daysAgo: 0 }, // fresh
    ],
  },
  {
    manual: { name: "Chicken breast", category: "meat", defaultUnit: "kg", defaultShelfLifeDays: 90, defaultLocation: "freezer" },
    forms: [{ unit: "kg", qty: 1.5, location: "freezer", shelfLifeDays: 90, daysAgo: 2 }], // fresh
  },
  {
    manual: { name: "Frozen peas", category: "frozen", defaultUnit: "bag", defaultShelfLifeDays: 120, defaultLocation: "freezer" },
    forms: [{ unit: "bag", qty: 2, location: "freezer", shelfLifeDays: 120, daysAgo: 20 }], // fresh
  },
  {
    manual: { name: "Rice", category: "pantry", defaultUnit: "bag", defaultShelfLifeDays: 365, defaultLocation: "pantry" },
    forms: [{ unit: "bag", qty: 1, location: "pantry", shelfLifeDays: 365, daysAgo: 30 }], // fresh
  },
  {
    manual: { name: "Olive oil", category: "condiments", defaultUnit: "bottle", defaultShelfLifeDays: 180, defaultLocation: "pantry" },
    forms: [{ unit: "bottle", qty: 1, location: "pantry", shelfLifeDays: 180, daysAgo: 15 }], // fresh
  },
  {
    manual: { name: "Bread", category: "bakery", defaultUnit: "loaf", defaultShelfLifeDays: 5, defaultLocation: "counter" },
    forms: [{ unit: "loaf", qty: 1, location: "counter", shelfLifeDays: 5, daysAgo: 3 }], // danger
  },
  {
    manual: { name: "Bananas", category: "produce", defaultUnit: "piece", defaultShelfLifeDays: 6, defaultLocation: "counter" },
    forms: [{ unit: "piece", qty: 6, location: "counter", shelfLifeDays: 6, daysAgo: 3 }], // warning
  },
  {
    manual: { name: "Yogurt", category: "dairy", defaultUnit: "tub", defaultShelfLifeDays: 14, defaultLocation: "fridge" },
    forms: [{ unit: "tub", qty: 2, location: "fridge", shelfLifeDays: 14, daysAgo: 6 }], // fresh
  },
];

const GROCERY_ROWS: { name: string; category: string; qty: number; unit: string; checked: boolean }[] = [
  { name: "Milk", category: "dairy", qty: 2, unit: "bottle", checked: false },
  { name: "Eggs", category: "eggs", qty: 1, unit: "dozen", checked: false },
  { name: "Coffee", category: "pantry", qty: 1, unit: "bag", checked: true },
  { name: "Paper towels", category: "household", qty: 1, unit: "pack", checked: false },
  { name: "Bananas", category: "produce", qty: 1, unit: "piece", checked: true },
  { name: "Olive oil", category: "condiments", qty: 1, unit: "bottle", checked: false },
];

async function main() {
  const db = await getDb();
  const userDoc =
    (await db.collection("user").findOne({ email: DEMO_EMAIL })) ??
    (await db.collection("users").findOne({ email: DEMO_EMAIL }));
  if (!userDoc) {
    throw new Error(`No account found for ${DEMO_EMAIL} — sign up through the app UI first, then re-run this.`);
  }
  const userId = userDoc._id instanceof ObjectId ? userDoc._id : new ObjectId(userDoc._id);

  const existing = await userItemRepository.findAllForUser(userId);
  if (existing.length > 0) {
    console.log(`[skip] ${DEMO_EMAIL} already has ${existing.length} item(s) — already seeded.`);
    return;
  }

  for (const { manual, forms } of ITEMS) {
    const item = await resolution.createManualItem(userId, manual);
    for (const f of forms) {
      await userItemRepository.addForm(userId, item._id, {
        unit: f.unit,
        qty: f.qty,
        location: f.location,
        shelfLifeDays: f.shelfLifeDays,
        addedDate: new Date(Date.now() - f.daysAgo * MS_PER_DAY),
      });
    }
    console.log(`[item] ${manual.name} (${forms.length} form${forms.length === 1 ? "" : "s"})`);
  }

  for (const row of GROCERY_ROWS) {
    const created = await groceryListService.addItem(userId, {
      selection: { kind: "freeText", name: row.name, category: row.category },
      qty: row.qty,
      unit: row.unit,
      storeId: null,
    });
    if (row.checked) {
      await groceryListService.toggleChecked(userId, created._id, true);
    }
  }
  console.log(`[grocery] ${GROCERY_ROWS.length} row(s)`);

  await templateService.createTemplate(userId, "Usual Order", [
    { name: "Milk", category: "dairy", storeId: null, unit: "bottle", qty: 2 },
    { name: "Eggs", category: "eggs", storeId: null, unit: "dozen", qty: 1 },
    { name: "Bread", category: "bakery", storeId: null, unit: "loaf", qty: 1 },
    { name: "Coffee", category: "pantry", storeId: null, unit: "bag", qty: 1 },
  ]);
  console.log(`[template] "Usual Order" created`);

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
