export type AppMode = "mock" | "live";

// NEXT_PUBLIC_* must be referenced literally so Next can inline them in the browser bundle.
export const APP_MODE: AppMode = process.env.NEXT_PUBLIC_APP_MODE === "live" ? "live" : "mock";
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
export const MOCK_LATENCY_ON = process.env.NEXT_PUBLIC_MOCK_LATENCY !== "off";

/** Server side variables that live mode cannot start without. */
export const LIVE_REQUIRED_ENV = [
  "DATABASE_URL",
  "NEON_AUTH_BASE_URL",
  "NEON_STORAGE_BUCKET",
  "NEON_STORAGE_ENDPOINT",
  "NEON_STORAGE_ACCESS_KEY_ID",
  "NEON_STORAGE_SECRET_ACCESS_KEY",
] as const;

export function missingLiveEnv(env: Record<string, string | undefined> = process.env): string[] {
  return LIVE_REQUIRED_ENV.filter((k) => !env[k]);
}

/** Throws in live mode when keys are missing. Called from instrumentation.ts at server start. */
export function assertConfig(env: Record<string, string | undefined> = process.env): void {
  if (env.NEXT_PUBLIC_APP_MODE !== "live") return;
  const missing = missingLiveEnv(env);
  if (missing.length > 0) {
    throw new Error(
      `NEXT_PUBLIC_APP_MODE=live but these variables are missing: ${missing.join(", ")}. ` +
        "Fill them in (see .env.example) or set NEXT_PUBLIC_APP_MODE=mock.",
    );
  }
}
