const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";
const COINGECKO_SEARCH_URL = "https://api.coingecko.com/api/v3/search";
const COINGECKO_API_KEY =
  process.env.COINGECKO_API_KEY || "CG-itm1SEKJTc6pg9f9N8qk2BR2";
const SOURCE = "CoinGecko";

export interface PriceMovement {
  tokenSymbol: string;
  coinGeckoId: string | null;
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

interface CoinGeckoSearchCoin {
  id?: unknown;
  symbol?: unknown;
}

interface CoinGeckoSearchResponse {
  coins?: CoinGeckoSearchCoin[];
  data?: {
    coins?: CoinGeckoSearchCoin[];
  };
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
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function withApiKey(url: URL): string {
  url.searchParams.set("x_cg_demo_api_key", COINGECKO_API_KEY);

  return url.toString();
}

function buildSearchUrl(tokenSymbol: string): string {
  const url = new URL(COINGECKO_SEARCH_URL);
  url.searchParams.set("query", tokenSymbol);

  return withApiKey(url);
}

function buildCoinGeckoUrl(coinGeckoId: string): string {
  const url = new URL(COINGECKO_PRICE_URL);
  url.searchParams.set("ids", coinGeckoId);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_24hr_vol", "true");

  return withApiKey(url);
}

function redactApiKey(endpoint: string): string {
  const url = new URL(endpoint);

  if (url.searchParams.has("x_cg_demo_api_key")) {
    url.searchParams.set("x_cg_demo_api_key", "<redacted>");
  }

  return url.toString();
}

async function fetchJson<T>(endpoint: string, label: string): Promise<T> {
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
}

function findCoinGeckoId(
  response: CoinGeckoSearchResponse,
  tokenSymbol: string,
): string | null {
  const coins = response.data?.coins ?? response.coins ?? [];
  const match = coins.find(
    (coin) =>
      typeof coin.id === "string" &&
      typeof coin.symbol === "string" &&
      coin.symbol.toLowerCase() === tokenSymbol.toLowerCase(),
  );

  return typeof match?.id === "string" ? match.id : null;
}

export async function getPriceMovement(
  tokenSymbol: string,
): Promise<PriceMovement> {
  const searchEndpoint = buildSearchUrl(tokenSymbol);
  const redactedSearchEndpoint = redactApiKey(searchEndpoint);

  try {
    const searchResponse = await fetchJson<CoinGeckoSearchResponse>(
      searchEndpoint,
      "CoinGecko search",
    );
    const coinGeckoId = findCoinGeckoId(searchResponse, tokenSymbol);

    if (!coinGeckoId) {
      return {
        tokenSymbol,
        coinGeckoId: null,
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
          searchEndpoint: redactedSearchEndpoint,
          searchResponse,
          error: `No CoinGecko coin found for symbol ${tokenSymbol}`,
        },
      };
    }

    const priceEndpoint = buildCoinGeckoUrl(coinGeckoId);
    const response = await fetchJson<CoinGeckoSimplePriceResponse>(
      priceEndpoint,
      "CoinGecko price",
    );
    const priceData = response[coinGeckoId];

    if (!priceData) {
      throw new Error(`CoinGecko response missing ${coinGeckoId} price data`);
    }

    const currentPrice = asNumber(priceData.usd);
    const change24hr = asNumber(priceData.usd_24h_change);
    const volume24hr = asNumber(priceData.usd_24h_vol);

    return {
      tokenSymbol,
      coinGeckoId,
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
        coinGeckoId,
        searchEndpoint: redactedSearchEndpoint,
        priceEndpoint: redactApiKey(priceEndpoint),
        response,
      },
    };
  } catch (error) {
    console.error("[getPriceMovement] failed:", errorSummary(error));

    return {
      tokenSymbol,
      coinGeckoId: null,
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
        searchEndpoint: redactedSearchEndpoint,
        error: errorSummary(error),
      },
    };
  }
}
