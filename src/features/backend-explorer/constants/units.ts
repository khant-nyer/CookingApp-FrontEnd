export const unitOptions = ['G', 'KG', 'MG', 'MCG', 'ML', 'L', 'TSP', 'TBSP', 'CUP', 'OZ', 'LB', 'PIECE', 'PINCH', 'CLOVE', 'SLICE'] as const;

export type UnitOption = (typeof unitOptions)[number];
