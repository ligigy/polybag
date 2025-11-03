import { NextRequest } from "next/server";
import PolymarketClobAdapter from "@/services/polymarket/clob-adapter";

function encodeSse(data: unknown, event?: string) {
  let chunk = "";
  if (event) chunk += `event: ${event}\n`;
  chunk += `data: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(chunk);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenID = searchParams.get("tokenID");
  const mode = searchParams.get("mode") || "ws"; // ws | poll

  if (!tokenID) {
    return Response.json({ error: "missing_tokenID" }, { status: 400 });
  }

  const adapter = new PolymarketClobAdapter();
  await adapter.init();

  if (mode === "poll") {
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        controller.enqueue(new TextEncoder().encode(":ok\n\n"));
        let lastHash = "";
        const push = async () => {
          const ob = await adapter.getOrderBook(tokenID);
          const hash =
            JSON.stringify(ob.bids.slice(0, 5)) +
            JSON.stringify(ob.asks.slice(0, 5));
          if (hash !== lastHash) {
            lastHash = hash;
            controller.enqueue(encodeSse({ orderbook: ob }, "orderbook"));
          }
        };
        await push();
        const interval = setInterval(push, 3_000);
        // @ts-expect-error controller.signal by Web Streams
        const signal: AbortSignal | undefined = controller.signal;
        if (signal) {
          signal.addEventListener("abort", () => clearInterval(interval));
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      controller.enqueue(new TextEncoder().encode(":ok\n\n"));
      try {
        const { PolymarketWSClient } = await import("@/services/polymarket/ws-client");
        const { normalizeWsMarketToOrderBook } = await import(
          "@/services/polymarket/normalize"
        );
        const cfg = adapter.getConfig();
        const baseWs = cfg.wsUrl.endsWith("/market") ? cfg.wsUrl : `${cfg.wsUrl}/market`;
        const client = new PolymarketWSClient({
          url: baseWs,
          onMessage: (msg) => {
            const ob = normalizeWsMarketToOrderBook(tokenID, msg);
            if (ob) controller.enqueue(encodeSse({ orderbook: ob }, "orderbook"));
          },
          onError: (err) => {
            controller.enqueue(encodeSse({ error: String(err) }, "error"));
          },
        });
        await client.connect();
        await client.subscribeMarket({ assets_ids: [tokenID], initial_dump: true });
        // @ts-expect-error signal available
        const signal: AbortSignal | undefined = controller.signal;
        if (signal) signal.addEventListener("abort", () => client.close(true));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encodeSse({ error: message }, "error"));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
