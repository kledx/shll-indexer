import { createConfig } from "ponder";
import { http, type Transport } from "viem";

import { ListingManagerAbi } from "./abis/ListingManagerAbi";
import { AgentNFAAbi } from "./abis/AgentNFAAbi";

const rpcEnv = process.env.PONDER_RPC_URLS_97 ?? process.env.PONDER_RPC_URL_97 ?? "https://bsctestapi.terminet.io/rpc";
const rpcCandidates = rpcEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const maxRequestsPerSecond = Number(process.env.MAX_REQUESTS_PER_SECOND ?? 1);
const minIntervalMs = Number(
  process.env.RPC_MIN_INTERVAL_MS ?? Math.ceil(1000 / Math.max(maxRequestsPerSecond, 0.1)),
);
const pollingInterval = Number(process.env.POLLING_INTERVAL_MS ?? 10_000);
const ethGetLogsBlockRange = Number(process.env.ETH_GET_LOGS_BLOCK_RANGE ?? 1);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return /429|Too Many Requests|limit exceeded|LimitExceededRpcError|rate limit/i.test(msg);
}

function createRateLimitedRpcTransport(urls: string[], requestIntervalMs: number): Transport {
  if (urls.length === 0) {
    throw new Error("No RPC endpoints configured for bscTestnet");
  }

  let queue: Promise<void> = Promise.resolve();
  let lastRequestAt = 0;
  let nextIndex = 0;

  return (({ chain, timeout }) => {
    const timeoutMs = timeout ?? 10_000;
    const clients = urls.map((url) =>
      http(url, { retryCount: 0, timeout: timeoutMs })({
        chain,
        retryCount: 0,
        timeout: timeoutMs,
      }),
    );
    const template = clients[0] as Record<string, unknown>;

    return {
      ...template,
      request: async (args: unknown) => {
        const run = async () => {
          const elapsed = Date.now() - lastRequestAt;
          if (elapsed < requestIntervalMs) {
            await sleep(requestIntervalMs - elapsed);
          }
          lastRequestAt = Date.now();

          const start = nextIndex;
          let lastError: unknown;

          for (let offset = 0; offset < clients.length; offset++) {
            const idx = (start + offset) % clients.length;
            const client = clients[idx] as { request: (params: unknown) => Promise<unknown> };
            try {
              const result = await client.request(args);
              nextIndex = (idx + 1) % clients.length;
              return result;
            } catch (error) {
              lastError = error;
              if (!isRateLimitError(error) || offset === clients.length - 1) throw error;
            }
          }

          throw lastError ?? new Error("RPC request failed");
        };

        const pending = queue.then(run, run);
        queue = pending.then(
          () => undefined,
          () => undefined,
        );
        return pending;
      },
    } as unknown as ReturnType<Transport>;
  }) as Transport;
}

const rpc = createRateLimitedRpcTransport(rpcCandidates, minIntervalMs);

console.log("DEBUG: PONDER_RPC_URL_97 =", rpcCandidates);
console.log("DEBUG: MAX_RPS =", maxRequestsPerSecond);
console.log("DEBUG: RPC_MIN_INTERVAL_MS =", minIntervalMs);
console.log("DEBUG: POLLING_INTERVAL_MS =", pollingInterval);
console.log("DEBUG: ETH_GET_LOGS_BLOCK_RANGE =", ethGetLogsBlockRange);

export default createConfig({
  chains: {
    bscTestnet: {
      id: 97,
      // Custom transport: serialized requests + min-interval throttling + multi-RPC failover.
      rpc,
      // Throttle and shrink log windows for strict public RPC providers
      maxRequestsPerSecond,
      pollingInterval,
      ethGetLogsBlockRange,
    },
  },
  contracts: {
    ListingManager: {
      chain: "bscTestnet",
      abi: ListingManagerAbi,
      address: "0x599917b3df76b9A599b4C6f58E6aE5adE9b185B5",
      startBlock: 89967916,
    },
    AgentNFA: {
      chain: "bscTestnet",
      abi: AgentNFAAbi,
      address: "0x30Ba562CE38fbD0ff300Dfc4b0271fe9c40C4cf0",
      startBlock: 89967916,
    },
  },
});
