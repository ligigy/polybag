"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketDetailsProps {
  loading?: boolean;
  event?: Record<string, any> | null;
}

function formatDate(value: string | number | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function MarketDetails({ loading, event }: MarketDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>事件详情</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : event ? (
          <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            <div>
              <span className="font-medium">标题：</span>
              {event.title || event.name || "-"}
            </div>
            <div>
              <span className="font-medium">Slug：</span>
              <code className="break-all">{event.slug || "-"}</code>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <span className="font-medium">开始时间：</span>
                {formatDate(event.startDate || event.createdAt)}
              </div>
              <div>
                <span className="font-medium">结束时间：</span>
                {formatDate(event.endDate)}
              </div>
              <div>
                <span className="font-medium">活跃：</span>
                {String(event.active ?? "-")}
              </div>
              <div>
                <span className="font-medium">已关闭：</span>
                {String(event.closed ?? "-")}
              </div>
            </div>
            <div>
              <span className="font-medium">描述：</span>
              <div className="mt-1 whitespace-pre-wrap rounded bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
                {event.description || "-"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">请输入事件 slug 查询详情。</div>
        )}
      </CardContent>
    </Card>
  );
}
