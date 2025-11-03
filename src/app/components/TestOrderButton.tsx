"use client";
import React from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/app/components/ui/toast";

export default function TestOrderButton({
  tokenID,
  side = "BUY" as "BUY" | "SELL",
}: {
  tokenID: string;
  side?: "BUY" | "SELL";
}) {
  const { notify } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [amount, setAmount] = React.useState(5); // USDC amount for market order

  async function placeTestOrder() {
    setBusy(true);
    try {
      const credsRaw = sessionStorage.getItem("polymarket_apikey_session");
      if (!credsRaw) throw new Error("未找到会话 API Key，请先在首页派生");
      const creds = JSON.parse(credsRaw);
      const apiUrl =
        process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";
      const chain = Number(
        process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137
      );
      const { ClobClient, OrderType, Side } = await import(
        "@polymarket/clob-client"
      );
      const { BrowserProvider } = await import("ethers");
      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error("未检测到浏览器钱包");
      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = signerV6 as any;
      if (
        typeof signer._signTypedData !== "function" &&
        typeof signer.signTypedData === "function"
      ) {
        signer._signTypedData = (domain: any, types: any, value: any) =>
          signer.signTypedData(domain, types, value);
      }
      const client = new ClobClient(apiUrl, chain, signer, creds);
      const order = await client.createMarketOrder({
        tokenID,
        amount,
        side: side === "SELL" ? Side.SELL : Side.BUY,
        orderType: OrderType.FOK,
      });
      const resp = await client.postOrder(order, OrderType.FOK);
      notify("下单成功");
      console.log("Order response", resp);
    } catch (e: any) {
      notify(`下单失败：${e?.message || ""}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="w-24"
        min={1}
        step={1}
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value || "1"))}
      />
      <Button disabled={busy} onClick={placeTestOrder}>
        测试下单（{side}/{amount} USDC）
      </Button>
    </div>
  );
}
