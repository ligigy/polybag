import { NextRequest } from 'next/server';
import { readJson } from '@/lib/persistence/fsState';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const running = await readJson<boolean>(`strategies/${id}/running.json`, false);
  const state = await readJson<any>(`strategies/${id}/state.json`, null);
  const plan = await readJson<any>(`strategies/${id}/plan.json`, null);
  const desired = await readJson<any>(`strategies/${id}/desired.json`, []);
  const config = await readJson<any>(`strategies/${id}/config.json`, null);

  return Response.json({
    id,
    running,
    state,
    plan,
    desired,
    config,
    updatedAt: Date.now(),
  });
}
