import { readJson, writeJson } from "@/lib/persistence/fsState";
import {
  calculateLayers,
  reconcileOrders,
} from "@/lib/grid/gridEngine";
import type { GridConfig, PlacedOrder } from "@/lib/grid/types";

interface RunnerState {
  startedAt: number;
  lastHeartbeat: number;
  plan: ReturnType<typeof reconcileOrders> | null;
}

// 简化版 runner：周期性生成目标层级与差异计划，持久化到文件。
export async function startGridRunner(id: string) {
  await writeJson(`strategies/${id}/running.json`, true);
  const initState: RunnerState = {
    startedAt: Date.now(),
    lastHeartbeat: Date.now(),
    plan: null,
  };
  await writeJson(`strategies/${id}/state.json`, initState);

  const timer = setInterval(async () => {
    const cfg = await readJson<GridConfig | null>(
      `strategies/${id}/config.json`,
      null
    );
    const now = Date.now();
    if (!cfg) {
      await writeJson(`strategies/${id}/state.json`, {
        startedAt: initState.startedAt,
        lastHeartbeat: now,
        plan: null,
      });
      return;
    }

    const layers = calculateLayers(cfg);
    const existingOrders = await readJson<PlacedOrder[]>(
      `strategies/${id}/orders.json`,
      []
    );
    const plan = reconcileOrders(existingOrders, layers, cfg);

    await Promise.all([
      writeJson(`strategies/${id}/desired.json`, layers),
      writeJson(`strategies/${id}/plan.json`, plan),
      writeJson(`strategies/${id}/state.json`, {
        startedAt: initState.startedAt,
        lastHeartbeat: now,
        plan,
      }),
    ]);
  }, 5_000);

  return timer;
}

export async function stopGridRunner(id: string) {
  await Promise.all([
    writeJson(`strategies/${id}/running.json`, false),
    writeJson(`strategies/${id}/state.json`, {
      stoppedAt: Date.now(),
      plan: null,
    }),
  ]);
}
