import { ObjectId } from "mongodb";
import { userUnitPresetRepository } from "@/lib/repositories/userUnitPresetRepository";
import { userItemRepository } from "@/lib/repositories/userItemRepository";
import {
  CATEGORY_UNIT_PRESETS,
  GENERIC_UNITS,
  type UnitPresetCategory,
} from "@/lib/constants/unitPresets";

// Picker source list, in priority order (docs/02-database-schema.md
// "Units — presets over free text"): this item's own previously-used
// units first, then the user's learned units for the category, then the
// static presets. Caller appends "Other" in the UI.
export async function unitPickerSource(
  userId: ObjectId,
  category: string,
  itemId?: ObjectId
): Promise<string[]> {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const add = (unit: string) => {
    if (!seen.has(unit)) {
      seen.add(unit);
      ordered.push(unit);
    }
  };

  if (itemId) {
    const item = await userItemRepository.findById(userId, itemId);
    item?.forms.forEach((f) => add(f.unit));
  }

  const learned = await userUnitPresetRepository.findForCategory(userId, category);
  learned?.units.forEach(add);

  const presets = CATEGORY_UNIT_PRESETS[category as UnitPresetCategory] ?? [];
  presets.forEach(add);
  GENERIC_UNITS.forEach(add);

  return ordered;
}

export async function learnUnit(userId: ObjectId, category: string, unit: string): Promise<void> {
  await userUnitPresetRepository.learnUnit(userId, category, unit);
}

// Settings > User Units — every category this user has taught a custom
// unit to, via "Other ->" or the settings screen itself.
export async function listLearnedUnits(userId: ObjectId) {
  return userUnitPresetRepository.findAllForUser(userId);
}
