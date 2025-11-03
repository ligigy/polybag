import { NextRequest } from "next/server";

const DEFAULT_HOST =
  process.env.CLOB_API_URL || process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";

interface DeriveProxyRequest {
  action?: "create" | "derive" | "createOrDerive";
  headers: Record<string, string>;
  host?: string;
}

function sanitizeHeaders(input: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      result[key.toUpperCase()] = value;
    }
  }
  return result;
}

async function forward(
  url: string,
  method: "POST" | "GET",
  headers: Record<string, string>
) {
  const requestHeaders: Record<string, string> = {
    accept: "application/json",
    ...headers,
  };
  if (method === "POST") {
    requestHeaders["content-type"] = "application/json";
  }
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: method === "POST" ? "{}" : undefined,
    cache: "no-store",
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: response.status, data };
}

export async function POST(req: NextRequest) {
  let payload: DeriveProxyRequest;
  try {
    payload = (await req.json()) as DeriveProxyRequest;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || !payload.headers) {
    return Response.json({ error: "missing_headers" }, { status: 400 });
  }

  const action = payload.action ?? "createOrDerive";
  const headers = sanitizeHeaders(payload.headers);
  if (!headers.POLY_ADDRESS || !headers.POLY_SIGNATURE) {
    return Response.json({ error: "missing_signature_headers" }, { status: 400 });
  }

  const baseHost = (payload.host || DEFAULT_HOST).replace(/\/$/, "");
  const createUrl = `${baseHost}/auth/api-key`;
  const deriveUrl = `${baseHost}/auth/derive-api-key`;

  try {
    if (action === "derive") {
      const result = await forward(deriveUrl, "GET", headers);
      return Response.json(result.data, { status: result.status });
    }

    if (action === "create") {
      const result = await forward(createUrl, "POST", headers);
      return Response.json(result.data, { status: result.status });
    }

    // createOrDerive: try create first, fallback到 derive
    const createResult = await forward(createUrl, "POST", headers);
    const createData = createResult.data as
      | { key?: string; apiKey?: string; error?: string }
      | undefined;

    if (
      createResult.status >= 200 &&
      createResult.status < 300 &&
      createData &&
      (createData.key || (createData as Record<string, unknown>).apiKey)
    ) {
      return Response.json(createResult.data, { status: createResult.status });
    }

    const deriveResult = await forward(deriveUrl, "GET", headers);
    return Response.json(deriveResult.data, { status: deriveResult.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
