const DEFILLAMA_HISTORY_URL =
  "https://api.llama.fi/v2/historicalChainTvl/Pharos";
const DEFILLAMA_CHAINS_URL = "https://api.llama.fi/chains";

export interface TVLShift {
  currentTVL: number | null;
  tvlChange24hr: number | null;
  tvlProxy: number | null;
  latestBlock: number | null;
  blockTime: string | null;
  txPerBlock: number | null;
  source: string;
  rawData: unknown | null;
}

interface HistoricalTvlEntry {
  date?: unknown;
  tvl?: unknown;
}

interface ChainTvlEntry {
  name?: unknown;
  tvl?: unknown;
  tvlPrevDay?: unknown;
}

function errorSummary(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
  };
}

function asNumber(value: unknown): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numberValue) ? numberValue : null;
}

async function fetchJson<T>(endpoint: string, label: string): Promise<T> {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      const body = await response.text().catch(() => "");

      throw new Error(
        `${label} failed: ${response.status} ${response.statusText}${
          body ? ` - ${body}` : ""
        }`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`${label} failed: ${String(error)}`);
  }
}

function calculateTvlChange(currentTVL: number, previousTVL: number): number {
  if (previousTVL === 0) {
    return 0;
  }

  return ((currentTVL - previousTVL) / previousTVL) * 100;
}

async function fetchHistoricalTvl(): Promise<{
  currentTVL: number | null;
  tvlChange24hr: number;
  response: HistoricalTvlEntry[];
}> {
  const response = await fetchJson<unknown>(
    DEFILLAMA_HISTORY_URL,
    "DeFiLlama historical TVL",
  );
  if (!Array.isArray(response)) {
    throw new Error("DeFiLlama historical TVL response was not an array");
  }

  const latest = response[response.length - 1];
  const previous = response[response.length - 2];
  const currentTVL = asNumber(latest?.tvl);
  const previousTVL = asNumber(previous?.tvl);

  return {
    currentTVL,
    tvlChange24hr:
      currentTVL === null || previousTVL === null
        ? 0
        : calculateTvlChange(currentTVL, previousTVL),
    response,
  };
}

async function fetchChainsTvl(): Promise<{
  currentTVL: number | null;
  tvlChange24hr: number;
  response: ChainTvlEntry[];
  pharos: ChainTvlEntry | null;
}> {
  const response = await fetchJson<unknown>(
    DEFILLAMA_CHAINS_URL,
    "DeFiLlama chains",
  );
  if (!Array.isArray(response)) {
    throw new Error("DeFiLlama chains response was not an array");
  }

  const pharos =
    response.find(
      (chain) =>
        typeof chain.name === "string" &&
        chain.name.toLowerCase().includes("pharos"),
    ) ?? null;
  const currentTVL = asNumber(pharos?.tvl);
  const previousTVL = asNumber(pharos?.tvlPrevDay);

  return {
    currentTVL,
    tvlChange24hr:
      currentTVL === null || previousTVL === null
        ? 0
        : calculateTvlChange(currentTVL, previousTVL),
    response,
    pharos,
  };
}

export async function getTVLShift(protocolName: string): Promise<TVLShift> {
  try {
    const historical = await fetchHistoricalTvl();

    return {
      currentTVL: historical.currentTVL,
      tvlChange24hr: historical.tvlChange24hr,
      tvlProxy: historical.currentTVL,
      latestBlock: null,
      blockTime: null,
      txPerBlock: null,
      source: "DeFiLlama historicalChainTvl",
      rawData: {
        protocolName,
        endpoint: DEFILLAMA_HISTORY_URL,
        response: historical.response,
      },
    };
  } catch (historyError) {
    console.error("[getTVLShift] historical TVL failed:", errorSummary(historyError));

    try {
      const chains = await fetchChainsTvl();

      return {
        currentTVL: chains.currentTVL,
        tvlChange24hr: chains.tvlChange24hr,
        tvlProxy: chains.currentTVL,
        latestBlock: null,
        blockTime: null,
        txPerBlock: null,
        source: "DeFiLlama chains",
        rawData: {
          protocolName,
          endpoint: DEFILLAMA_CHAINS_URL,
          pharos: chains.pharos,
        },
      };
    } catch (chainsError) {
      console.error("[getTVLShift] chains fallback failed:", errorSummary(chainsError));

      return {
        currentTVL: null,
        tvlChange24hr: 0,
        tvlProxy: null,
        latestBlock: null,
        blockTime: null,
        txPerBlock: null,
        source: "unavailable",
        rawData: {
          protocolName,
          historyEndpoint: DEFILLAMA_HISTORY_URL,
          chainsEndpoint: DEFILLAMA_CHAINS_URL,
          historyError: errorSummary(historyError),
          chainsError: errorSummary(chainsError),
        },
      };
    }
  }
}
