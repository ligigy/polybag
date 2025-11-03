"use client";
import React from "react";
import WalletConnectButton from "@/app/components/WalletConnectButton";
import AccountStatusPanel from "@/app/components/AccountStatusPanel";
import ApiKeyManager from "@/app/components/ApiKeyManager";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomeDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg">连接与导航</CardTitle>
          <WalletConnectButton />
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/grid">进入网格策略</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AccountStatusPanel />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Key 管理</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeyManager />
        </CardContent>
      </Card>
    </div>
  );
}
