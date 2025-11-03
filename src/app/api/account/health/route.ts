import { NextRequest } from 'next/server';
import AccountService from '@/services/polymarket/account';

export async function GET(_req: NextRequest) {
  const svc = new AccountService();
  const health = await svc.getHealth();
  return Response.json(health);
}

