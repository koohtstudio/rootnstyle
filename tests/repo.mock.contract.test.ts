import { runRepoContract } from "@/lib/repo/contract/contract";
import { createMockRepo } from "@/lib/repo/mock";
import { memoryBus, memoryKV } from "@/lib/repo/mock/store";

runRepoContract("mock adapter", () => ({
  repo: createMockRepo({ storage: memoryKV(), channel: memoryBus().create(), latency: null }),
}));
