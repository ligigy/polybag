import { GridConfig, GridLevel, PlacedOrder, ReconcilePlan } from "./types";
import { buildGridLevels } from "./levels";

export function calculateLayers(cfg: GridConfig): GridLevel[] {
  return buildGridLevels(cfg).levels;
}

export function generateIdempotencyKey(
  marketId: string,
  outcome: string,
  price: number
): string {
  return `${marketId}:${outcome}:${price.toFixed(6)}`;
}

export function reconcileOrders(
  currentOrders: PlacedOrder[],
  targetLevels: GridLevel[],
  cfg: GridConfig
): ReconcilePlan {
  const desiredMap = new Map<number, GridLevel>();
  for (const level of targetLevels) {
    desiredMap.set(level.price, level);
  }

  const toCancel: string[] = [];
  const demand = new Map<number, number>();

  for (const level of targetLevels) {
    demand.set(level.price, level.targetQty);
  }

  for (const order of currentOrders) {
    if (!desiredMap.has(order.price)) {
      if (order.status === "OPEN" || order.status === "PARTIAL") {
        toCancel.push(order.id);
      }
      continue;
    }
    const remaining = (order.size - order.filled) || 0;
    const need = demand.get(order.price) ?? 0;
    const stillNeed = Math.max(need - remaining, 0);
    demand.set(order.price, stillNeed);
  }

  const toCreate: ReconcilePlan["toCreate"] = [];
  for (const [price, qty] of demand.entries()) {
    if (qty <= 0) continue;
    const key = generateIdempotencyKey(cfg.marketId, cfg.outcome, price);
    toCreate.push({ price, size: qty, idempotencyKey: key });
  }

  return { toCreate, toCancel };
}
