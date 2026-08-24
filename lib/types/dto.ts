// Client-side shapes of what the API actually sends over the wire: Mongo
// ObjectIds and Dates serialize to plain strings via NextResponse.json.
// Mirrors lib/schemas/** but with string ids/dates instead of ObjectId/Date.
import type { Location } from "@/lib/schemas/shared";

export interface FormDTO {
  id: string;
  unit: string;
  qty: number;
  note?: string;
  location: Location;
  addedDate: string;
  shelfLifeDays: number;
}

export interface ThresholdDTO {
  unit: string;
  minQty: number;
}

export interface UserItemDTO {
  _id: string;
  userId: string;
  name: string;
  category: string;
  globalItemId: string | null;
  defaultUnit: string;
  defaultShelfLifeDays: number;
  defaultLocation: Location;
  thresholds: ThresholdDTO[];
  forms: FormDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface GlobalItemDTO {
  _id: string;
  name: string;
  category: string;
  defaultUnit: string;
  defaultShelfLifeDays: number;
  defaultLocation: Location;
  status: "active" | "pending";
  createdAt: string;
}

export interface CatalogSearchResultDTO {
  globalMatches: GlobalItemDTO[];
  userMatches: UserItemDTO[];
}

export interface GlobalStoreDTO {
  _id: string;
  name: string;
}

export interface UserStoreDTO {
  _id: string;
  userId: string;
  name: string;
  globalStoreId: string | null;
}

export interface StoreSearchResultDTO {
  globalMatches: GlobalStoreDTO[];
  userMatches: UserStoreDTO[];
}

export interface UserUnitPresetDTO {
  _id: string;
  userId: string;
  category: string;
  units: string[];
}

export interface GroceryListItemDTO {
  _id: string;
  userId: string;
  userItemId: string | null;
  name: string;
  category: string;
  storeId: string | null;
  qty: number;
  unit: string;
  checked: boolean;
  createdAt: string;
}

export interface TemplateItemDTO {
  name: string;
  category: string;
  storeId: string | null;
  unit: string;
  qty: number;
}

export interface ListTemplateDTO {
  _id: string;
  userId: string;
  name: string;
  items: TemplateItemDTO[];
}

export interface UseSoonRowDTO {
  itemId: string;
  itemName: string;
  formId: string;
  unit: string;
  qty: number;
  location: Location;
  daysLeft: number;
}

// Mirrors lib/schemas/selection.ts's itemSelectionSchema at the wire
// boundary (string ids, not ObjectId).
export type ItemSelectionInput =
  | { kind: "global"; globalItemId: string }
  | { kind: "userItem"; userItemId: string }
  | {
      kind: "manual";
      manual: {
        name: string;
        category: string;
        defaultUnit: string;
        defaultShelfLifeDays: number;
        defaultLocation: Location;
      };
    };

export type GroceryAddSelectionInput =
  | { kind: "global"; globalItemId: string }
  | { kind: "userItem"; userItemId: string }
  | { kind: "freeText"; name: string; category: string };

export interface HouseholdDTO {
  _id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  isOwner: boolean;
}

export interface HouseholdMemberDTO {
  id: string;
  name: string;
  email: string;
}

export interface HouseholdDetailDTO {
  household: Omit<HouseholdDTO, "isOwner">;
  members: HouseholdMemberDTO[];
}

export interface HouseholdInviteDTO {
  _id: string;
  householdId: string;
  token: string;
  createdByUserId: string;
  createdAt: string;
  revoked: boolean;
}

export interface HouseholdItemDTO {
  _id: string;
  householdId: string;
  addedByUserId: string;
  name: string;
  category: string;
  globalItemId: string | null;
  defaultUnit: string;
  defaultShelfLifeDays: number;
  defaultLocation: Location;
  thresholds: ThresholdDTO[];
  forms: FormDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdCatalogSearchResultDTO {
  globalMatches: GlobalItemDTO[];
  householdMatches: HouseholdItemDTO[];
}

export type HouseholdItemSelectionInput =
  | { kind: "global"; globalItemId: string }
  | { kind: "householdItem"; householdItemId: string }
  | {
      kind: "manual";
      manual: {
        name: string;
        category: string;
        defaultUnit: string;
        defaultShelfLifeDays: number;
        defaultLocation: Location;
      };
    };

export interface HouseholdGroceryListItemDTO {
  _id: string;
  householdId: string;
  addedByUserId: string;
  householdItemId: string | null;
  name: string;
  category: string;
  qty: number;
  unit: string;
  checked: boolean;
  createdAt: string;
}

export type HouseholdGroceryAddSelectionInput =
  | { kind: "global"; globalItemId: string }
  | { kind: "householdItem"; householdItemId: string }
  | { kind: "freeText"; name: string; category: string };
