import { NextRequest } from 'next/server';
import { readJson } from '@/lib/persistence/fsState';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const running = await readJson<boolean>(`strategies/${id}/running.json`, false);
  const lastHeartbeat = await readJson<number>(`strategies/${id}/lastHeartbeat.json`, 0);
  return Response.json({ id, running, lastHeartbeat, updatedAt: Date.now() });
}

