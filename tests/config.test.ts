import { describe, expect, it } from "vitest";
import { assertConfig, missingLiveEnv } from "@/lib/config";

describe("config", () => {
  it("does nothing in mock mode", () => {
    expect(() => assertConfig({ NEXT_PUBLIC_APP_MODE: "mock" })).not.toThrow();
    expect(() => assertConfig({})).not.toThrow();
  });
  it("fails loudly in live mode with missing keys, and names them", () => {
    expect(() => assertConfig({ NEXT_PUBLIC_APP_MODE: "live" })).toThrow(/DATABASE_URL/);
    expect(missingLiveEnv({ DATABASE_URL: "x" })).not.toContain("DATABASE_URL");
  });
  it("passes in live mode when everything is set", () => {
    const env: Record<string, string> = { NEXT_PUBLIC_APP_MODE: "live" };
    for (const k of missingLiveEnv({})) env[k] = "x";
    expect(() => assertConfig(env)).not.toThrow();
  });
});
