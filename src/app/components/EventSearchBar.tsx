"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface EventSearchBarProps {
  defaultValue?: string;
  loading?: boolean;
  onSearch: (slug: string) => void;
}

export default function EventSearchBar({
  defaultValue = "",
  loading = false,
  onSearch,
}: EventSearchBarProps) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="输入 Polymarket 事件 slug，例如 election-2024"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              onSearch(value.trim());
            }
          }}
          disabled={loading}
        />
        <Button
          onClick={() => value.trim() && onSearch(value.trim())}
          disabled={loading || !value.trim()}
        >
          {loading ? "查询中..." : "查询"}
        </Button>
      </div>
      {loading && <Skeleton className="h-1 w-full" />}
    </div>
  );
}
