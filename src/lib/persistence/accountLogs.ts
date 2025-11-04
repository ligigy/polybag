import { readJson, writeJson } from "@/lib/persistence/fsState";

export interface RiskEvent {
  id: string;
  rule: string;
  action: string;
  message?: string;
  createdAt: number;
}

export async function appendRiskEvent(event: RiskEvent) {
  const list = await readJson<RiskEvent[]>("risk/events.json", []);
  list.unshift(event);
  await writeJson("risk/events.json", list.slice(0, 200));
}

export async function listRiskEvents(limit = 50): Promise<RiskEvent[]> {
  const list = await readJson<RiskEvent[]>("risk/events.json", []);
  return list.slice(0, limit);
}
