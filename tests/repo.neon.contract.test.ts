import { describe, it } from "vitest";
import { runRepoContract } from "@/lib/repo/contract/contract";
import { createNeonRepo } from "@/lib/repo/neon";

// The Neon adapter is a stub today. When it is written, set NEON_CONTRACT_URL to a
// scratch Neon branch and this suite runs the exact same contract the mock adapter passes.
if (process.env.NEON_CONTRACT_URL) {
  runRepoContract("neon adapter", () => ({ repo: createNeonRepo() }));
} else {
  describe.skip("repo contract: neon adapter", () => {
    it("runs once the Neon adapter exists and NEON_CONTRACT_URL is set", () => {});
  });
}
