"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RiskEvent {
  id: string;
  rule: string;
  action: string;
  message?: string;
  createdAt: number;
}

export default function RiskEventTimeline() {
  const [events, setEvents] = React.useState<RiskEvent[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/events?limit=50", {
        cache: "no-store",
      });
      const data = await res.json();
      setEvents(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">风控触发历史</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading && !events ? (
          <Skeleton className="h-24 w-full" />
        ) : events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="border-l-2 border-primary pl-3">
                <div className="text-xs text-zinc-500">
                  {new Date(evt.createdAt).toLocaleString()}
                </div>
                <div className="font-medium">规则：{evt.rule}</div>
                <div>动作：{evt.action}</div>
                {evt.message && (
                  <div className="text-xs text-zinc-600">{evt.message}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-zinc-500">暂无风控事件</div>
        )}
      </CardContent>
    </Card>
  );
}
