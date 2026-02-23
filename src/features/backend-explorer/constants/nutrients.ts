interface NutrientCatalogItem {
  key: string;
  short: string;
  group: string;
  icon: string;
  aliases: string[];
}

export const nutrientCatalog: NutrientCatalogItem[] = [
  { key: 'CALORIES', short: 'CAL', group: 'Energy', icon: '🔥', aliases: ['energy', 'kcal'] },
  { key: 'PROTEIN', short: 'PRO', group: 'Macronutrients', icon: '💪', aliases: ['prot'] },
  { key: 'CARBOHYDRATES', short: 'CARB', group: 'Macronutrients', icon: '🍞', aliases: ['carbs'] },
  { key: 'FAT', short: 'FAT', group: 'Macronutrients', icon: '🥑', aliases: ['total fat'] },
  { key: 'DIETARY_FIBER', short: 'DFIB', group: 'Macronutrients', icon: '🌿', aliases: ['fiber'] },
  { key: 'SUGARS', short: 'SUG', group: 'Macronutrients', icon: '🍬', aliases: ['sugar', 'total sugars'] },
  { key: 'ADDED_SUGARS', short: 'ASUG', group: 'Macronutrients', icon: '🧁', aliases: ['added sugar', 'added sugars'] },
  { key: 'CHOLESTEROL', short: 'CHOL', group: 'Macronutrients', icon: '🧪', aliases: [] },
  { key: 'SATURATED_FAT', short: 'SAT', group: 'Fat Types', icon: '🧈', aliases: [] },
  { key: 'MONOUNSATURATED_FAT', short: 'MUFA', group: 'Fat Types', icon: '🫒', aliases: [] },
  { key: 'POLYUNSATURATED_FAT', short: 'PUFA', group: 'Fat Types', icon: '🌰', aliases: [] },
  { key: 'TRANS_FAT', short: 'TRANS', group: 'Fat Types', icon: '⚠️', aliases: [] },
  { key: 'OMEGA_3', short: 'O3', group: 'Fat Types', icon: '🐟', aliases: ['epa', 'dha', 'ala'] },
  { key: 'OMEGA_6', short: 'O6', group: 'Fat Types', icon: '🥜', aliases: ['linoleic acid'] },
  { key: 'VITAMIN_A', short: 'VA', group: 'Vitamins', icon: '🥕', aliases: [] },
  { key: 'VITAMIN_B1', short: 'B1', group: 'Vitamins', icon: '🧠', aliases: ['thiamin'] },
  { key: 'VITAMIN_B2', short: 'B2', group: 'Vitamins', icon: '⚡', aliases: ['riboflavin'] },
  { key: 'VITAMIN_B3', short: 'B3', group: 'Vitamins', icon: '🌟', aliases: ['niacin'] },
  { key: 'VITAMIN_B5', short: 'B5', group: 'Vitamins', icon: '✨', aliases: ['pantothenic acid'] },
  { key: 'VITAMIN_B6', short: 'B6', group: 'Vitamins', icon: '🍗', aliases: [] },
  { key: 'VITAMIN_B7', short: 'B7', group: 'Vitamins', icon: '💅', aliases: ['biotin'] },
  { key: 'VITAMIN_B9', short: 'B9', group: 'Vitamins', icon: '🥬', aliases: ['folate', 'folic acid'] },
  { key: 'VITAMIN_B12', short: 'B12', group: 'Vitamins', icon: '🥩', aliases: ['cobalamin'] },
  { key: 'VITAMIN_C', short: 'VC', group: 'Vitamins', icon: '🍊', aliases: ['ascorbic'] },
  { key: 'VITAMIN_D', short: 'VD', group: 'Vitamins', icon: '☀️', aliases: [] },
  { key: 'VITAMIN_E', short: 'VE', group: 'Vitamins', icon: '🌻', aliases: [] },
  { key: 'VITAMIN_K', short: 'VK', group: 'Vitamins', icon: '🥦', aliases: [] },
  { key: 'CHOLINE', short: 'CHO', group: 'Vitamins', icon: '🧠', aliases: [] },
  { key: 'CALCIUM', short: 'CA', group: 'Minerals', icon: '🦴', aliases: [] },
  { key: 'CHROMIUM', short: 'CR', group: 'Minerals', icon: '⚙️', aliases: [] },
  { key: 'COPPER', short: 'CU', group: 'Minerals', icon: '🟠', aliases: [] },
  { key: 'IODINE', short: 'I', group: 'Minerals', icon: '🧂', aliases: [] },
  { key: 'IRON', short: 'FE', group: 'Minerals', icon: '🩸', aliases: [] },
  { key: 'MAGNESIUM', short: 'MG', group: 'Minerals', icon: '⚙️', aliases: [] },
  { key: 'MANGANESE', short: 'MN', group: 'Minerals', icon: '🟤', aliases: [] },
  { key: 'MOLYBDENUM', short: 'MO', group: 'Minerals', icon: '🔧', aliases: [] },
  { key: 'PHOSPHORUS', short: 'P', group: 'Minerals', icon: '⚗️', aliases: [] },
  { key: 'POTASSIUM', short: 'K', group: 'Minerals', icon: '🍌', aliases: [] },
  { key: 'SELENIUM', short: 'SE', group: 'Minerals', icon: '🧪', aliases: [] },
  { key: 'SODIUM', short: 'NA', group: 'Minerals', icon: '🧂', aliases: ['salt'] },
  { key: 'ZINC', short: 'ZN', group: 'Minerals', icon: '🔩', aliases: [] }
];

export const nutrientOptions = nutrientCatalog.map((item) => item.key);
export const nutrientAliasToKey: Record<string, string> = nutrientCatalog.reduce<Record<string, string>>((acc, item) => {
  acc[item.key] = item.key;
  acc[item.key.toLowerCase()] = item.key;
  (item.aliases || []).forEach((alias) => {
    acc[alias] = item.key;
    acc[alias.toLowerCase()] = item.key;
  });
  return acc;
}, { SUGAR: 'SUGARS', sugar: 'SUGARS' });

export const nutrientIcons = Object.fromEntries(nutrientCatalog.map((item) => [item.key, item.icon || '🧪'])) as Record<string, string>;
export const nutrientShortNames = Object.fromEntries(nutrientCatalog.map((item) => [item.key, item.short || item.key])) as Record<string, string>;
export const nutrientGroups = nutrientCatalog.reduce<Record<string, string[]>>((acc, item) => {
  acc[item.group] = acc[item.group] || [];
  acc[item.group].push(item.key);
  return acc;
}, {});
