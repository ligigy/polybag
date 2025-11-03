"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  exportStoredApiKey,
  getStoredApiKey,
  hasStoredApiKey,
  importStoredApiKey,
  setStoredApiKey,
  type ApiKeyCreds,
} from "@/lib/storage/apiKeyStore";
import { ensureTypedDataCompatibility } from "@/lib/wallet/signTypedData";
import { useAccount } from "wagmi";

function Masked({ value }: { value: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="truncate max-w-xs">{show ? value : "••••••••••••"}</code>
      <button className="text-sm underline" onClick={() => setShow((s) => !s)}>
        {show ? "隐藏" : "显示"}
      </button>
      <button
        className="text-sm underline"
        onClick={() => navigator.clipboard.writeText(value)}
      >
        复制
      </button>
    </div>
  );
}

export default function ApiKeyManager() {
  const { address, chainId, isConnected } = useAccount();
  const { notify } = useToast();
  const requiredChain = Number(
    process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [creds, setCreds] = React.useState<ApiKeyCreds | null>(null);
  const [keysList, setKeysList] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    setCreds(getStoredApiKey());
  }, []);

  async function deriveKey() {
    setBusy(true);
    setError(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";
      const chain = Number(
        process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137
      );
      // dynamic import to keep SSR clean
      const { ClobClient } = await import("@polymarket/clob-client");
      const { BrowserProvider } = await import("ethers");
      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error("未检测到浏览器钱包");
      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      // ethers v6 没有 _signTypedData，clob-client 期望 v5 接口；做一层适配
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);
      const client = new ClobClient(apiUrl, chain, signer);
      const resp = await client.createOrDeriveApiKey();
      if (!resp?.key || !resp?.secret || !resp?.passphrase)
        throw new Error("派生失败");
      const newCreds = {
        key: String(resp.key),
        secret: String(resp.secret),
        passphrase: String(resp.passphrase),
      };
      setCreds(newCreds);
      setStoredApiKey(newCreds);
      notify("API Key 派生成功");
    } catch (e: any) {
      setError(e?.message || "派生失败");
      notify(`派生失败：${e?.message || ""}`);
    } finally {
      setBusy(false);
    }
  }

  async function listKeys() {
    setBusy(true);
    setError(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";
      const chain = Number(
        process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137
      );
      if (!creds) throw new Error("请先派生 API Key");
      const { ClobClient } = await import("@polymarket/clob-client");
      const { BrowserProvider } = await import("ethers");
      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error("未检测到浏览器钱包");
      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);
      const client = new ClobClient(apiUrl, chain, signer, creds);
      const resp = await client.getApiKeys();
      setKeysList(resp?.data || resp || []);
      notify("已获取 API Keys");
    } catch (e: any) {
      setError(e?.message || "获取失败");
      notify(`获取失败：${e?.message || ""}`);
    } finally {
      setBusy(false);
    }
  }

  async function revokeCurrent() {
    setBusy(true);
    setError(null);
    try {
      if (!creds) throw new Error("无当前 API Key");
      const apiUrl =
        process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";
      const chain = Number(
        process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137
      );
      const { ClobClient } = await import("@polymarket/clob-client");
      const { BrowserProvider } = await import("ethers");
      const eth: any = (window as any).ethereum;
      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);
      const client = new ClobClient(apiUrl, chain, signer, creds);
      await client.deleteApiKey();
      // clear local
      setCreds(null);
      setStoredApiKey(null);
      setKeysList(null);
      notify("已吊销当前 Key 并清除本地");
    } catch (e: any) {
      setError(e?.message || "吊销失败");
      notify(`吊销失败：${e?.message || ""}`);
    } finally {
      setBusy(false);
    }
  }

  async function listBuilderKeys() {
    setBusy(true);
    setError(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";
      const chain = Number(
        process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137
      );
      if (!creds) throw new Error("请先派生 API Key");
      const { ClobClient } = await import("@polymarket/clob-client");
      const { BrowserProvider } = await import("ethers");
      const eth: any = (window as any).ethereum;
      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);
      const client = new ClobClient(apiUrl, chain, signer, creds);
      const resp = await client.getBuilderApiKeys?.();
      setKeysList(resp?.data || resp || []);
      notify("已获取 Builder Keys");
    } catch (e: any) {
      setError(e?.message || "获取 Builder Keys 失败");
      notify(`获取 Builder Keys 失败：${e?.message || ""}`);
    } finally {
      setBusy(false);
    }
  }

  async function revokeAllBuilderKeys() {
    setBusy(true);
    setError(null);
    try {
      if (!creds) throw new Error("请先派生 API Key");
      const apiUrl = process.env.NEXT_PUBLIC_CLOB_API_URL || "";
      const chain = Number(
        process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137
      );
      const { ClobClient } = await import("@polymarket/clob-client");
      const { BrowserProvider } = await import("ethers");
      const eth: any = (window as any).ethereum;
      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);
      const client = new ClobClient(apiUrl, chain, signer, creds);
      await client.revokeBuilderApiKeys?.();
      setKeysList(null);
      notify("已吊销所有 Builder Keys");
    } catch (e: any) {
      setError(e?.message || "吊销失败");
      notify(`吊销失败：${e?.message || ""}`);
    } finally {
      setBusy(false);
    }
  }

  function exportCurrent() {
    if (!creds) return;
    const serialized = exportStoredApiKey();
    if (!serialized) return;
    const blob = new Blob([serialized], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "polymarket_apikey_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFromText() {
    const text = prompt("粘贴从备份文件复制的 JSON：");
    if (!text) return;
    try {
      const imported = importStoredApiKey(text);
      setCreds(imported);
    } catch (err) {
      alert((err as Error)?.message || "解析失败");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">API Key 管理</h2>
      <p className="text-sm text-zinc-600">
        安全提示：仅在浏览器会话中保存，不会发送到服务器。请妥善备份并在不用时吊销。
      </p>

      <div className="text-sm">
        <div>
          钱包连接：
          {isConnected ? (
            <span className="text-green-600">已连接</span>
          ) : (
            <span className="text-red-600">未连接</span>
          )}
        </div>
        <div>
          地址：<code className="break-all">{address || "-"}</code>
        </div>
        <div>
          链 ID：{chainId || "-"}{" "}
          {chainId && chainId !== requiredChain ? (
            <span className="text-red-600">
              （与要求链 {requiredChain} 不一致）
            </span>
          ) : null}
        </div>
        <div>
          CLOB：
          {process.env.NEXT_PUBLIC_CLOB_API_URL ||
            "https://clob.polymarket.com"}
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={
            busy || !isConnected || (chainId && chainId !== requiredChain)
          }
          onClick={deriveKey}
        >
          派生/创建 API Key
        </Button>
        <Button
          variant="outline"
          disabled={busy || !creds || (chainId && chainId !== requiredChain)}
          onClick={listKeys}
        >
          列出当前账户的 API Keys
        </Button>
        <Button
          variant="outline"
          disabled={busy || !creds || (chainId && chainId !== requiredChain)}
          onClick={listBuilderKeys}
        >
          列出 Builder Keys
        </Button>
        <Button
          variant="destructive"
          disabled={busy || !creds || (chainId && chainId !== requiredChain)}
          onClick={revokeCurrent}
        >
          吊销当前保存在本地的 Key
        </Button>
        <Button
          variant="destructive"
          disabled={busy || !creds || (chainId && chainId !== requiredChain)}
          onClick={revokeAllBuilderKeys}
        >
          吊销所有 Builder Keys
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCreds(null);
            setStoredApiKey(null);
          }}
        >
          仅从本设备清除
        </Button>
        <Button variant="outline" disabled={!creds} onClick={exportCurrent}>
          导出备份
        </Button>
        <Button variant="outline" onClick={importFromText}>
          从备份导入
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">当前会话的 API Key</h3>
        {creds ? (
          <div className="space-y-1">
            <div>
              key: <code className="break-all">{creds.key}</code>
            </div>
            <div>
              secret: <Masked value={creds.secret} />
            </div>
            <div>
              passphrase: <Masked value={creds.passphrase} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-600">无</div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">服务端返回的 Key 列表</h3>
        {Array.isArray(keysList) ? (
          <pre className="text-xs bg-zinc-100 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(keysList, null, 2)}
          </pre>
        ) : (
          <div className="text-sm text-zinc-600">未查询</div>
        )}
      </div>
    </div>
  );
}
