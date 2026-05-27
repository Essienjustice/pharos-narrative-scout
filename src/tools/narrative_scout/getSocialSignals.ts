const COINGECKO_COIN_URL =
  "https://api.coingecko.com/api/v3/coins/pharos-network";
const COINGECKO_TRENDING_URL =
  "https://api.coingecko.com/api/v3/search/trending";
const COINGECKO_ID = "pharos-network";
const SOURCE = "CoinGecko Exchange Listings";

export interface SocialSignals {
  mentionCount: number;
  mentionSpike: number;
  trendingRank: number | null;
  source: string;
  rawData: unknown | null;
}

interface CoinGeckoCoinResponse {
  tickers?: unknown[];
}

interface CoinGeckoTrendingCoin {
  item?: {
    id?: unknown;
  };
}

interface CoinGeckoTrendingResponse {
  coins?: CoinGeckoTrendingCoin[];
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

function withApiKey(url: URL): string {
  url.searchParams.set("x_cg_demo_api_key", process.env.COINGECKO_API_KEY ?? "");

  return url.toString();
}

function buildTrendingUrl(): string {
  return withApiKey(new URL(COINGECKO_TRENDING_URL));
}

function buildCoinUrl(): string {
  const url = new URL(COINGECKO_COIN_URL);

  url.searchParams.set("localization", "false");
  url.searchParams.set("tickers", "true");
  url.searchParams.set("market_data", "false");
  url.searchParams.set("community_data", "false");
  url.searchParams.set("developer_data", "false");

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

export async function getSocialSignals(
  tokenSymbol: string,
): Promise<SocialSignals> {
  const trendingEndpoint = buildTrendingUrl();
  const coinEndpoint = buildCoinUrl();
  let trendingResponse: CoinGeckoTrendingResponse | null = null;
  let coinResponse: CoinGeckoCoinResponse | null = null;
  let trendingRank: number | null = null;
  let mentionCount = 0;

  try {
    trendingResponse = await fetchJson<CoinGeckoTrendingResponse>(
      trendingEndpoint,
      "CoinGecko trending",
    );
    const trendingIndex =
      trendingResponse.coins?.findIndex((coin) => coin.item?.id === COINGECKO_ID) ??
      -1;

    trendingRank = trendingIndex === -1 ? null : trendingIndex + 1;
  } catch (error) {
    console.error("[getSocialSignals] CoinGecko trending failed:", error);
  }

  try {
    coinResponse = await fetchJson<CoinGeckoCoinResponse>(
      coinEndpoint,
      "CoinGecko coin tickers",
    );
    mentionCount = Array.isArray(coinResponse.tickers)
      ? coinResponse.tickers.length
      : 0;
  } catch (error) {
    console.error("[getSocialSignals] CoinGecko coin tickers failed:", error);
  }

  return {
    mentionCount,
    mentionSpike: 0,
    trendingRank,
    source: SOURCE,
    rawData: {
      tokenSymbol,
      trendingEndpoint: redactApiKey(trendingEndpoint),
      coinEndpoint: redactApiKey(coinEndpoint),
      trendingResponse,
      coinResponse,
    },
  };
}
