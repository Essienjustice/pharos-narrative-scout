const COINGECKO_COIN_URL = "https://api.coingecko.com/api/v3/coins/pharos-network";
const COINGECKO_TRENDING_URL = "https://api.coingecko.com/api/v3/search/trending";
const COINGECKO_ID = "pharos-network";
const SOURCE = "CoinGecko Exchange Listings";
function errorSummary(error) {
    if (!(error instanceof Error)) {
        return error;
    }
    return {
        name: error.name,
        message: error.message,
    };
}
function withApiKey(url) {
    url.searchParams.set("x_cg_demo_api_key", process.env.COINGECKO_API_KEY ?? "");
    return url.toString();
}
function buildTrendingUrl() {
    return withApiKey(new URL(COINGECKO_TRENDING_URL));
}
function buildCoinUrl() {
    const url = new URL(COINGECKO_COIN_URL);
    url.searchParams.set("localization", "false");
    url.searchParams.set("tickers", "true");
    url.searchParams.set("market_data", "false");
    url.searchParams.set("community_data", "false");
    url.searchParams.set("developer_data", "false");
    return withApiKey(url);
}
function redactApiKey(endpoint) {
    const url = new URL(endpoint);
    if (url.searchParams.has("x_cg_demo_api_key")) {
        url.searchParams.set("x_cg_demo_api_key", "<redacted>");
    }
    return url.toString();
}
async function fetchJson(endpoint, label) {
    const response = await fetch(endpoint);
    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`${label} failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`);
    }
    return (await response.json());
}
export async function getSocialSignals(tokenSymbol) {
    const trendingEndpoint = buildTrendingUrl();
    const coinEndpoint = buildCoinUrl();
    let trendingResponse = null;
    let coinResponse = null;
    let trendingRank = null;
    let mentionCount = 0;
    try {
        trendingResponse = await fetchJson(trendingEndpoint, "CoinGecko trending");
        const trendingIndex = trendingResponse.coins?.findIndex((coin) => coin.item?.id === COINGECKO_ID) ??
            -1;
        trendingRank = trendingIndex === -1 ? null : trendingIndex + 1;
    }
    catch (error) {
        console.error("[getSocialSignals] CoinGecko trending failed:", error);
    }
    try {
        coinResponse = await fetchJson(coinEndpoint, "CoinGecko coin tickers");
        mentionCount = Array.isArray(coinResponse.tickers)
            ? coinResponse.tickers.length
            : 0;
    }
    catch (error) {
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
