const DEFILLAMA_PROTOCOLS_URL = "https://api.llama.fi/protocols";

export interface TVLShift {
  protocolName: string;
  protocolSlug: string | null;
  currentTVL: number | null;
  tvlChange24hr: number | null;
  tvlProxy: number | null;
  latestBlock: number | null;
  blockTime: string | null;
  txPerBlock: number | null;
  source: string;
  rawData: unknown | null;
}

interface DeFiLlamaProtocol {
  name?: unknown;
  slug?: unknown;
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

async function fetchProtocols(): Promise<DeFiLlamaProtocol[]> {
  const response = await fetchJson<unknown>(
    DEFILLAMA_PROTOCOLS_URL,
    "DeFiLlama protocols",
  );
  if (!Array.isArray(response)) {
    throw new Error("DeFiLlama protocols response was not an array");
  }

  return response as DeFiLlamaProtocol[];
}

function findProtocol(
  protocols: DeFiLlamaProtocol[],
  protocolName: string,
): DeFiLlamaProtocol | null {
  const normalizedProtocolName = protocolName.toLowerCase();

  return (
    protocols.find((protocol) => {
      const name =
        typeof protocol.name === "string" ? protocol.name.toLowerCase() : "";
      const slug =
        typeof protocol.slug === "string" ? protocol.slug.toLowerCase() : "";

      return (
        name.includes(normalizedProtocolName) ||
        slug.includes(normalizedProtocolName)
      );
    }) ?? null
  );
}

export async function getTVLShift(protocolName: string): Promise<TVLShift> {
  try {
    const protocols = await fetchProtocols();
    const protocol = findProtocol(protocols, protocolName);

    if (!protocol) {
      return {
        protocolName,
        protocolSlug: null,
        currentTVL: null,
        tvlChange24hr: null,
        tvlProxy: null,
        latestBlock: null,
        blockTime: null,
        txPerBlock: null,
        source: "DeFiLlama protocols",
        rawData: {
          protocolName,
          endpoint: DEFILLAMA_PROTOCOLS_URL,
          error: `No DeFiLlama protocol found for ${protocolName}`,
        },
      };
    }

    const currentTVL = asNumber(protocol.tvl);
    const previousTVL = asNumber(protocol.tvlPrevDay);

    return {
      protocolName:
        typeof protocol.name === "string" ? protocol.name : protocolName,
      protocolSlug: typeof protocol.slug === "string" ? protocol.slug : null,
      currentTVL,
      tvlChange24hr:
        currentTVL === null || previousTVL === null
          ? null
          : calculateTvlChange(currentTVL, previousTVL),
      tvlProxy: currentTVL,
      latestBlock: null,
      blockTime: null,
      txPerBlock: null,
      source: "DeFiLlama protocols",
      rawData: {
        protocolName,
        endpoint: DEFILLAMA_PROTOCOLS_URL,
        protocol,
      },
    };
  } catch (error) {
    console.error("[getTVLShift] protocols lookup failed:", errorSummary(error));

    return {
      protocolName,
      protocolSlug: null,
      currentTVL: null,
      tvlChange24hr: null,
      tvlProxy: null,
      latestBlock: null,
      blockTime: null,
      txPerBlock: null,
      source: "unavailable",
      rawData: {
        protocolName,
        endpoint: DEFILLAMA_PROTOCOLS_URL,
        error: errorSummary(error),
      },
    };
  }
}
