import { MOCK_LATENCY_ON } from "@/lib/config";
import { RepoError } from "../errors";
import { createMockRepo, type MockRepo } from "./index";
import { CHANNEL_NAME, memoryKV, SESSION_KEY, STORE_KEY, type ChannelLike, type KV } from "./store";

function browserStorage(): KV {
  try {
    const probe = "__rns_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private mode or blocked storage: keep working in memory for this tab.
    return memoryKV();
  }
}

/** Same checks the public route handler runs. Proves the API route is wired, and shares its rules. */
async function precheck(payload: unknown): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new RepoError("NETWORK", "We could not reach the server. Check your connection and try again.");
  }
  if (res.ok) return;
  const j = (await res.json().catch(() => ({}))) as { code?: RepoError["code"]; message?: string; issues?: Record<string, string> };
  throw new RepoError(j.code ?? "VALIDATION", j.message ?? "Please check the form and try again.", j.issues ?? {});
}

/** Shrinks to at most 900px and re-encodes as JPEG. Re-encoding also drops EXIF, including location. */
async function resizeToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const max = 900;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new RepoError("STORAGE", "This browser could not read that photo.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function createBrowserMockRepo(): MockRepo {
  const channel = typeof BroadcastChannel !== "undefined" ? (new BroadcastChannel(CHANNEL_NAME) as unknown as ChannelLike) : null;
  const repo = createMockRepo({
    storage: browserStorage(),
    channel,
    latency: MOCK_LATENCY_ON ? [150, 400] : null,
    precheck,
    uploader: resizeToDataUrl,
  });
  // Fallback sync path, and the only path for the session key.
  window.addEventListener("storage", (e) => {
    if (e.key === STORE_KEY || e.key === null) repo.__store.refreshFromExternal();
    if (e.key === SESSION_KEY || e.key === null) repo.__emitSession();
  });
  return repo;
}
