export type Outcome = 'YES' | 'NO';

export interface GridConfig {
  marketId: string;
  outcome: Outcome;
  priceMin: number;
  priceMax: number;
  step: number;
  sizePerLevel: number;
  budget: number;
}

export interface GridLevel {
  price: number;
  targetQty: number;
}

export interface DesiredGrid {
  levels: GridLevel[];
  totalQty: number;
}

