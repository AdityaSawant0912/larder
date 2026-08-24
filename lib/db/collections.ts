import { Collection } from "mongodb";
import { getDb } from "./connection";
import type { UserItem } from "@/lib/schemas/userItem";
import type { GlobalItem } from "@/lib/schemas/globalItem";
import type { UserStore, GlobalStore } from "@/lib/schemas/store";
import type { GroceryListItem } from "@/lib/schemas/groceryList";
import type { ListTemplate } from "@/lib/schemas/listTemplate";
import type { UserUnitPreset } from "@/lib/schemas/userUnitPreset";
import type { Household, HouseholdInvite } from "@/lib/schemas/household";
import type { HouseholdItem } from "@/lib/schemas/householdItem";
import type { HouseholdGroceryListItem } from "@/lib/schemas/householdGroceryList";

export async function userItemsCollection(): Promise<Collection<UserItem>> {
  return (await getDb()).collection<UserItem>("userItems");
}
export async function globalItemsCollection(): Promise<Collection<GlobalItem>> {
  return (await getDb()).collection<GlobalItem>("globalItems");
}
export async function userStoresCollection(): Promise<Collection<UserStore>> {
  return (await getDb()).collection<UserStore>("userStores");
}
export async function globalStoresCollection(): Promise<Collection<GlobalStore>> {
  return (await getDb()).collection<GlobalStore>("globalStores");
}
export async function groceryListCollection(): Promise<Collection<GroceryListItem>> {
  return (await getDb()).collection<GroceryListItem>("groceryList");
}
export async function listTemplatesCollection(): Promise<Collection<ListTemplate>> {
  return (await getDb()).collection<ListTemplate>("listTemplates");
}
export async function userUnitPresetsCollection(): Promise<Collection<UserUnitPreset>> {
  return (await getDb()).collection<UserUnitPreset>("userUnitPresets");
}
export async function householdsCollection(): Promise<Collection<Household>> {
  return (await getDb()).collection<Household>("households");
}
export async function householdInvitesCollection(): Promise<Collection<HouseholdInvite>> {
  return (await getDb()).collection<HouseholdInvite>("householdInvites");
}
export async function householdItemsCollection(): Promise<Collection<HouseholdItem>> {
  return (await getDb()).collection<HouseholdItem>("householdItems");
}
export async function householdGroceryListCollection(): Promise<Collection<HouseholdGroceryListItem>> {
  return (await getDb()).collection<HouseholdGroceryListItem>("householdGroceryList");
}
