// 简单的进程内运行器注册表（开发用途）
type Runner = { id: string; timer: any | null };

const runners = new Map<string, Runner>();

export function registerRunner(id: string, timer: any) {
  runners.set(id, { id, timer });
}

export function stopRunner(id: string) {
  const r = runners.get(id);
  if (r?.timer) try { clearInterval(r.timer); } catch {}
  runners.delete(id);
}

export function hasRunner(id: string): boolean {
  return runners.has(id);
}

