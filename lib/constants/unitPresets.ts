export const CATEGORY_UNIT_PRESETS = {
  produce: ["whole", "half", "slice", "piece", "bag", "container"],
  dairy: ["bottle", "carton", "block", "tub"],
  pantry: ["jar", "bag", "box", "can", "packet"],
} as const;

export const GENERIC_UNITS = ["g", "kg", "ml", "L", "piece"] as const;

export type UnitPresetCategory = keyof typeof CATEGORY_UNIT_PRESETS;
