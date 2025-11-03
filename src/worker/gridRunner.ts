import { readJson, writeJson } from '@/lib/persistence/fsState';
import { buildGridLevels } from '@/lib/grid/levels';
import type { GridConfig } from '@/lib/grid/types';

// 原子化：仅负责心跳与生成目标网格（先期不触发下单）
export async function startGridRunner(id: string) {
  // 防丢：立即写入 running 状态
  await writeJson(`strategies/${id}/running.json`, true);
  const timer = setInterval(async () => {
    // 心跳
    await writeJson(`strategies/${id}/lastHeartbeat.json`, Date.now());
    // 生成目标网格（用于后续差异对比）
    const cfg = await readJson<GridConfig | null>(`strategies/${id}/config.json`, null);
    if (cfg) {
      const desired = buildGridLevels(cfg);
      await writeJson(`strategies/${id}/desired.json`, desired);
    }
  }, 5000);
  return timer;
}

export async function stopGridRunner(id: string) {
  await writeJson(`strategies/${id}/running.json`, false);
}

