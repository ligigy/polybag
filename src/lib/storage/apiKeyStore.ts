export interface ApiKeyCreds {
  key: string;
  secret: string;
  passphrase: string;
}

const STORAGE_KEY = "polymarket_apikey_session";
export const API_KEY_CHANGED_EVENT = "polybag:api-key-changed";

function isBrowser() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function setStoredApiKey(creds: ApiKeyCreds | null): void {
  if (!isBrowser()) return;
  if (!creds) {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
  window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
}

export function getStoredApiKey(): ApiKeyCreds | null {
  if (!isBrowser()) return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ApiKeyCreds;
    if (parsed && parsed.key && parsed.secret && parsed.passphrase) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function hasStoredApiKey(): boolean {
  if (!isBrowser()) return false;
  return sessionStorage.getItem(STORAGE_KEY) !== null;
}

export function exportStoredApiKey(): string | null {
  const creds = getStoredApiKey();
  return creds ? JSON.stringify(creds) : null;
}

export function importStoredApiKey(json: string): ApiKeyCreds {
  const parsed = JSON.parse(json) as ApiKeyCreds;
  if (!parsed?.key || !parsed?.secret || !parsed?.passphrase) {
    throw new Error("invalid_api_key_backup");
  }
  setStoredApiKey(parsed);
  return parsed;
}
