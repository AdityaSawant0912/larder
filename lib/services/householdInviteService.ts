import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { householdInviteRepository } from "@/lib/repositories/householdInviteRepository";
import { assertOwner, requireHousehold } from "@/lib/services/householdService";
import type { HouseholdInvite } from "@/lib/schemas/household";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getOrCreateActiveInvite(
  userId: ObjectId,
  householdId: ObjectId
): Promise<HouseholdInvite> {
  const household = await requireHousehold(householdId);
  assertOwner(household, userId);
  const existing = await householdInviteRepository.findActiveByHousehold(householdId);
  if (existing) return existing;
  return householdInviteRepository.create({
    householdId,
    token: generateToken(),
    createdByUserId: userId,
    revoked: false,
  });
}

export async function regenerateInvite(userId: ObjectId, householdId: ObjectId): Promise<HouseholdInvite> {
  const household = await requireHousehold(householdId);
  assertOwner(household, userId);
  const existing = await householdInviteRepository.findActiveByHousehold(householdId);
  if (existing) await householdInviteRepository.revoke(existing._id);
  return householdInviteRepository.create({
    householdId,
    token: generateToken(),
    createdByUserId: userId,
    revoked: false,
  });
}

// Public preview for the unauthenticated /invite/[token] landing page —
// just enough to show "Join {name} ({N} members)" before login.
export async function previewInvite(
  token: string
): Promise<{ householdId: string; name: string; memberCount: number } | null> {
  const invite = await householdInviteRepository.findByToken(token);
  if (!invite) return null;
  const household = await householdRepository.findById(invite.householdId);
  if (!household) return null;
  return {
    householdId: household._id.toHexString(),
    name: household.name,
    memberCount: household.memberIds.length,
  };
}

export async function acceptInvite(userId: ObjectId, token: string): Promise<{ householdId: string }> {
  const invite = await householdInviteRepository.findByToken(token);
  if (!invite) throw new Error("Invite not found");
  await householdRepository.addMember(invite.householdId, userId);
  return { householdId: invite.householdId.toHexString() };
}
