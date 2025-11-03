"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

export default function StrategyStatusPanel({ id }: { id: string }) {
  const [status, setStatus] = React.useState<{ running: boolean; lastHeartbeat: number; updatedAt: number } | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetch(`/api/strategy/${encodeURIComponent(id)}/status`)
      .then(r => r.json())
      .then(d => { if (alive) setStatus(d); })
      .catch(() => {});
    return () => { alive = false };
  }, [id]);
  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <CardTitle className="font-medium">策略状态</CardTitle>
      </CardHeader>
      <CardContent>
        <div>运行: {status?.running ? '是' : '否'}</div>
        <div>上次心跳: {status?.lastHeartbeat ? new Date(status.lastHeartbeat).toLocaleString() : '-'}</div>
        <div>更新: {status?.updatedAt ? new Date(status.updatedAt).toLocaleString() : '-'}</div>
      </CardContent>
    </Card>
  );
}
