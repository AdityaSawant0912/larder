export const CATEGORY_UNIT_PRESETS = {
  produce: ["whole", "half", "slice", "piece", "bag", "container", "dozen"],
  dairy: ["bottle", "carton", "block", "tub"],
  eggs: ["dozen", "piece", "carton"],
  pantry: ["jar", "bag", "box", "can", "packet"],
  meat: ["piece", "slice", "pack", "kg", "lb"],
  seafood: ["piece", "pack", "kg", "lb"],
  frozen: ["bag", "box", "container", "pack"],
  bakery: ["loaf", "piece", "slice", "box", "dozen"],
  beverages: ["bottle", "can", "carton", "box", "L"],
  snacks: ["bag", "box", "packet", "piece"],
  spices: ["jar", "packet", "bottle"],
  condiments: ["bottle", "jar", "packet"],
  canned: ["can", "jar"],
  household: ["bottle", "box", "pack", "roll"],
  "personal care": ["bottle", "tube", "pack"],
} as const;

// Add-item flow's category dropdown — keeping this derived from the preset
// keys means a category can never end up without matching unit presets.
export const CATEGORIES = Object.keys(CATEGORY_UNIT_PRESETS) as UnitPresetCategory[];

export const GENERIC_UNITS = ["g", "kg", "ml", "L", "oz", "lb", "piece"] as const;

export type UnitPresetCategory = keyof typeof CATEGORY_UNIT_PRESETS;
