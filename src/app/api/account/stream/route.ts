import { NextRequest } from "next/server";
import AccountService from "@/services/polymarket/account";

function encodeSse(data: unknown, event?: string) {
  let chunk = "";
  if (event) chunk += `event: ${event}\n`;
  chunk += `data: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(chunk);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || undefined;

  const service = new AccountService();
  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      controller.enqueue(new TextEncoder().encode(":ok\n\n"));
      try {
        const accountStream = await service.watchAccount({ address });
        const unsubscribe = accountStream.onEvent((evt) => {
          controller.enqueue(encodeSse(evt, evt.type));
        });
        const status = accountStream.getStatus();
        controller.enqueue(encodeSse({ status }, "status"));
        // @ts-expect-error controller.signal available in runtime
        const signal: AbortSignal | undefined = controller.signal;
        if (signal) {
          signal.addEventListener("abort", async () => {
            unsubscribe();
            await accountStream.close();
          });
        }
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
