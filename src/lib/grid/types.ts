export type Outcome = "YES" | "NO";

export interface GridConfig {
  marketId: string;
  outcome: Outcome;
  priceMin: number;
  priceMax: number;
  step: number;
  sizePerLevel: number;
  budget: number;
  orderType?: "GTC" | "GTD" | "FAK" | "FOK";
  refillMode?: "ALWAYS" | "ON_FILL" | "NEVER";
  tokenID?: string;
  ttlSeconds?: number;
}

export interface GridLevel {
  price: number;
  targetQty: number;
  openOrderIds: string[];
}

export interface DesiredGrid {
  levels: GridLevel[];
  totalQty: number;
}

export interface PlacedOrder {
  id: string;
  price: number;
  size: number;
  filled: number;
  status: "OPEN" | "PARTIAL" | "FILLED" | "CANCELLED" | "REJECTED";
  clientOrderId?: string;
}

export interface ReconcilePlan {
  toCreate: {
    price: number;
    size: number;
    idempotencyKey: string;
  }[];
  toCancel: string[];
}
