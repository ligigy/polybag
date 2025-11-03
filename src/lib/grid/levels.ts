import { DesiredGrid, GridConfig, GridLevel } from './types';

// 原子化：根据配置生成网格层级
export function buildGridLevels(cfg: GridConfig): DesiredGrid {
  const { priceMin, priceMax, step, sizePerLevel } = cfg;
  if (!(priceMax > priceMin) || step <= 0) {
    return { levels: [], totalQty: 0 };
  }
  const levels: GridLevel[] = [];
  let p = round(priceMin, step);
  while (p <= priceMax + 1e-9) {
    levels.push({ price: round(p, step), targetQty: sizePerLevel });
    p += step;
  }
  return { levels, totalQty: levels.reduce((a, b) => a + b.targetQty, 0) };
}

function round(v: number, step: number) {
  const n = Math.round(v / step);
  return Number((n * step).toFixed(6));
}

