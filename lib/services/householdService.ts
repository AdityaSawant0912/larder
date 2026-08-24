import { ObjectId } from "mongodb";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { householdInviteRepository } from "@/lib/repositories/householdInviteRepository";
import { householdItemRepository } from "@/lib/repositories/householdItemRepository";
import { householdGroceryListRepository } from "@/lib/repositories/householdGroceryListRepository";
import { getUsersByIds, type UserSummary } from "@/lib/auth/users";
import type { Household } from "@/lib/schemas/household";

export function assertMember(household: Household, userId: ObjectId): void {
  if (!household.memberIds.some((id) => id.equals(userId))) {
    throw new Error("Forbidden");
  }
}

export function assertOwner(household: Household, userId: ObjectId): void {
  if (!household.ownerId.equals(userId)) {
    throw new Error("Forbidden");
  }
}

export async function requireHousehold(householdId: ObjectId): Promise<Household> {
  const household = await householdRepository.findById(householdId);
  if (!household) throw new Error("Household not found");
  return household;
}

export async function listForUser(userId: ObjectId): Promise<(Household & { isOwner: boolean })[]> {
  const households = await householdRepository.findAllForUser(userId);
  return households.map((h) => ({ ...h, isOwner: h.ownerId.equals(userId) }));
}

export async function createHousehold(userId: ObjectId, name: string): Promise<Household> {
  // No separate "create pantry/list" step — householdItems/householdGroceryList
  // are just empty query results scoped to this id until something's added.
  return householdRepository.create({ name, ownerId: userId, memberIds: [userId] });
}

export async function getHouseholdDetail(
  userId: ObjectId,
  householdId: ObjectId
): Promise<{ household: Household; members: UserSummary[] }> {
  const household = await requireHousehold(householdId);
  assertMember(household, userId);
  const members = await getUsersByIds(household.memberIds.map((id) => id.toHexString()));
  return { household, members };
}

export async function removeMember(
  userId: ObjectId,
  householdId: ObjectId,
  targetUserId: ObjectId
): Promise<void> {
  const household = await requireHousehold(householdId);
  assertOwner(household, userId);
  if (targetUserId.equals(household.ownerId)) {
    throw new Error("Owner can't be removed — delete the household instead");
  }
  await householdRepository.removeMember(householdId, targetUserId);
}

export async function leaveHousehold(userId: ObjectId, householdId: ObjectId): Promise<void> {
  const household = await requireHousehold(householdId);
  assertMember(household, userId);
  if (household.ownerId.equals(userId)) {
    throw new Error("Owner can't leave — delete the household instead");
  }
  await householdRepository.removeMember(householdId, userId);
}

// Owner-only, cascades: household items, grocery items, invite, then the
// household doc itself. No transaction — nothing else references these
// collections, so a partial failure just leaves harmless orphaned rows
// scoped to an already-deleted householdId.
export async function deleteHousehold(userId: ObjectId, householdId: ObjectId): Promise<void> {
  const household = await requireHousehold(householdId);
  assertOwner(household, userId);
  await householdItemRepository.deleteAllForHousehold(householdId);
  await householdGroceryListRepository.deleteAllForHousehold(householdId);
  await householdInviteRepository.deleteAllForHousehold(householdId);
  await householdRepository.delete(householdId);
}
