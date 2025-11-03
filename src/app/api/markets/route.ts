import { NextRequest } from "next/server";
import PolymarketClobAdapter from "@/services/polymarket/clob-adapter";

function encodeSse(data: any, event?: string) {
  let chunk = "";
  if (event) chunk += `event: ${event}\n`;
  chunk += `data: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(chunk);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sse = searchParams.get("sse");
  const tokenID = searchParams.get("tokenID") || undefined;
  const stream = searchParams.get("stream");
  const eventId = searchParams.get('eventId') || undefined;

  if (sse) {
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        controller.enqueue(new TextEncoder().encode(":ok\n\n"));
        const adapter = new PolymarketClobAdapter();
        try {
          await adapter.init();
          if (tokenID && stream === "ws") {
            // Try WS aggregation to forward market feed as SSE
            try {
              const { PolymarketWSClient } = await import(
                "@/services/polymarket/ws-client"
              );
              const { normalizeWsMarketToOrderBook } = await import(
                "@/services/polymarket/normalize"
              );
              const wsUrl =
                (adapter as any).cfg?.wsUrl ||
                "wss://ws-subscriptions-clob.polymarket.com/ws";
              const client = new PolymarketWSClient({
                url: `${wsUrl}/market`,
                onMessage: (msg) => {
                  // 归一化为订单簿后转发
                  const ob = normalizeWsMarketToOrderBook(tokenID, msg);
                  if (ob)
                    controller.enqueue(
                      encodeSse({ orderbook: ob }, "orderbook")
                    );
                },
                onError: (err) => {
                  controller.enqueue(
                    encodeSse({ error: String(err) }, "error")
                  );
                },
              } as any);
              await client.connect();
              await client.subscribe("market", {
                assets_ids: [tokenID],
                initial_dump: true,
              });
              // cleanup on abort
              // @ts-expect-error nextjs passes signal
              const signal: AbortSignal | undefined = (controller as any)
                .signal;
              if (signal)
                signal.addEventListener("abort", () => client.close());
            } catch (e: any) {
              controller.enqueue(
                encodeSse(
                  { error: e?.message || "ws unavailable, falling back" },
                  "error"
                )
              );
            }
          } else if (tokenID) {
            let lastHash = "";
            const pushOrderBook = async () => {
              const ob = await adapter.getOrderBook(tokenID);
              const hash =
                JSON.stringify(ob.bids.slice(0, 5)) +
                JSON.stringify(ob.asks.slice(0, 5));
              if (hash !== lastHash) {
                lastHash = hash;
                controller.enqueue(encodeSse({ orderbook: ob }, "orderbook"));
              }
            };
            await pushOrderBook();
            const interval = setInterval(pushOrderBook, 3000);
            // @ts-expect-error nextjs passes signal on controller
            const signal: AbortSignal | undefined = (controller as any).signal;
            if (signal)
              signal.addEventListener("abort", () => clearInterval(interval));
          } else {
            const markets = await adapter.listMarkets();
            controller.enqueue(encodeSse({ markets }, "snapshot"));
          }
        } catch (err: any) {
          controller.enqueue(
            encodeSse({ error: err?.message || "init failed" }, "error")
          );
        }
        const iv = setInterval(() => {
          controller.enqueue(
            new TextEncoder().encode(`: ping ${Date.now()}\n\n`)
          );
        }, 15000);
        // Close when client disconnects via cancellation
        // @ts-expect-error nextjs passes signal on controller
        const signal: AbortSignal | undefined = (controller as any).signal;
        if (signal) {
          signal.addEventListener("abort", () => clearInterval(iv));
        }
      },
      cancel: () => {},
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // JSON response（事件 markets 列表）
  const adapter = new PolymarketClobAdapter();
  try {
    await adapter.init();
    if (tokenID) {
      const orderbook = await adapter.getOrderBook(tokenID);
      return Response.json({ orderbook });
    }
    // 事件模式：当提供 eventId 时，通过 Gamma API 获取该事件的 markets
    if (eventId) {
      const GAMMA_API = process.env.GAMMA_API_URL || 'https://gamma-api.polymarket.com';
      const url = `${GAMMA_API}/markets?order=eventId&closed=false&limit=1000`;
      const r = await fetch(url, { headers: { accept: 'application/json' } });
      const data = await r.json();
      const arr: any[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      // 仅保留有效且属于该 eventId 的 markets：
      // 以 clobTokenIds（字符串JSON或数组）存在且含至少2个token为有效。
      const hasTwoTokens = (m: any) => {
        const c = (m.clobTokenIds || m.clob_token_ids);
        try {
          const arr = Array.isArray(c) ? c : JSON.parse(c || '[]');
          return Array.isArray(arr) && arr.length >= 2;
        } catch { return false; }
      };
      const belongs = (m: any) => String(m.eventId || m.event_id || m.event || '') === String(eventId);
      const filtered = arr.filter((m) => hasTwoTokens(m) && belongs(m));
      return Response.json({ data: filtered, next_cursor: data?.next_cursor || null, limit: data?.limit || filtered.length, count: filtered.length });
    }
    // 默认返回空结构（避免全量列表）
    return Response.json({ data: [], next_cursor: null, limit: 0, count: 0 });
  } catch (err: any) {
    console.log('Error in /api/markets:', err);
    return Response.json({ data: [], next_cursor: null, limit: 0, count: 0, error: err?.message || 'adapter_unavailable' });
  }
}
