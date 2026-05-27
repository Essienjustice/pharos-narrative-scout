const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";
const COINGECKO_ID = "pharos-network";
const SOURCE = "CoinGecko";

export interface PriceMovement {
  currentPrice: number | null;
  change24hr: number | null;
  volume24hr: number | null;
  isTopGainer: boolean | null;
  txCount: number | null;
  avgGasPrice: number | null;
  isActive: boolean | null;
  source: string;
  rawData: unknown | null;
}

interface CoinGeckoPriceData {
  usd?: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
}

type CoinGeckoSimplePriceResponse = Record<string, CoinGeckoPriceData>;

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
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildCoinGeckoUrl(): string {
  const url = new URL(COINGECKO_PRICE_URL);
  url.searchParams.set("ids", COINGECKO_ID);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_24hr_vol", "true");
  url.searchParams.set("x_cg_demo_api_key", process.env.COINGECKO_API_KEY ?? "");

  return url.toString();
}

function redactApiKey(endpoint: string): string {
  const url = new URL(endpoint);

  if (url.searchParams.has("x_cg_demo_api_key")) {
    url.searchParams.set("x_cg_demo_api_key", "<redacted>");
  }

  return url.toString();
}

async function fetchCoinGeckoPrice(): Promise<CoinGeckoSimplePriceResponse> {
  const endpoint = buildCoinGeckoUrl();
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(
      `CoinGecko price failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as CoinGeckoSimplePriceResponse;
}

export async function getPriceMovement(
  tokenSymbol: string,
): Promise<PriceMovement> {
  const endpoint = buildCoinGeckoUrl();
  const redactedEndpoint = redactApiKey(endpoint);

  try {
    const response = await fetchCoinGeckoPrice();
    const priceData = response[COINGECKO_ID];

    if (!priceData) {
      throw new Error(`CoinGecko response missing ${COINGECKO_ID} price data`);
    }

    const currentPrice = asNumber(priceData.usd);
    const change24hr = asNumber(priceData.usd_24h_change);
    const volume24hr = asNumber(priceData.usd_24h_vol);

    return {
      currentPrice,
      change24hr,
      volume24hr,
      isTopGainer: change24hr === null ? null : change24hr > 10,
      txCount: null,
      avgGasPrice: null,
      isActive: currentPrice !== null,
      source: SOURCE,
      rawData: {
        tokenSymbol,
        coinGeckoId: COINGECKO_ID,
        endpoint: redactedEndpoint,
        response,
      },
    };
  } catch (error) {
    console.error("[getPriceMovement] failed:", errorSummary(error));

    return {
      currentPrice: null,
      change24hr: null,
      volume24hr: null,
      isTopGainer: null,
      txCount: null,
      avgGasPrice: null,
      isActive: false,
      source: SOURCE,
      rawData: {
        tokenSymbol,
        coinGeckoId: COINGECKO_ID,
        endpoint: redactedEndpoint,
        error: errorSummary(error),
      },
    };
  }
}
