const COINGECKO_COIN_BASE_URL = "https://api.coingecko.com/api/v3/coins";
const COINGECKO_SEARCH_URL = "https://api.coingecko.com/api/v3/search";
const COINGECKO_TRENDING_URL = "https://api.coingecko.com/api/v3/search/trending";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "CG-itm1SEKJTc6pg9f9N8qk2BR2";
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
    url.searchParams.set("x_cg_demo_api_key", COINGECKO_API_KEY);
    return url.toString();
}
function buildTrendingUrl() {
    return withApiKey(new URL(COINGECKO_TRENDING_URL));
}
function buildSearchUrl(tokenSymbol) {
    const url = new URL(COINGECKO_SEARCH_URL);
    url.searchParams.set("query", tokenSymbol);
    return withApiKey(url);
}
function buildCoinUrl(coinGeckoId) {
    const url = new URL(`${COINGECKO_COIN_BASE_URL}/${coinGeckoId}`);
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
function findCoinGeckoId(response, tokenSymbol) {
    const coins = response.data?.coins ?? response.coins ?? [];
    const match = coins.find((coin) => typeof coin.id === "string" &&
        typeof coin.symbol === "string" &&
        coin.symbol.toLowerCase() === tokenSymbol.toLowerCase());
    return typeof match?.id === "string" ? match.id : null;
}
export async function getSocialSignals(tokenSymbol) {
    const searchEndpoint = buildSearchUrl(tokenSymbol);
    const trendingEndpoint = buildTrendingUrl();
    let searchResponse = null;
    let trendingResponse = null;
    let coinResponse = null;
    let coinGeckoId = null;
    let trendingRank = null;
    let mentionCount = 0;
    try {
        searchResponse = await fetchJson(searchEndpoint, "CoinGecko search");
        coinGeckoId = findCoinGeckoId(searchResponse, tokenSymbol);
    }
    catch (error) {
        console.error("[getSocialSignals] CoinGecko search failed:", errorSummary(error));
    }
    if (!coinGeckoId) {
        return {
            tokenSymbol,
            coinGeckoId: null,
            mentionCount,
            mentionSpike: 0,
            trendingRank,
            source: SOURCE,
            rawData: {
                tokenSymbol,
                searchEndpoint: redactApiKey(searchEndpoint),
                searchResponse,
                error: `No CoinGecko coin found for symbol ${tokenSymbol}`,
            },
        };
    }
    const coinEndpoint = buildCoinUrl(coinGeckoId);
    try {
        trendingResponse = await fetchJson(trendingEndpoint, "CoinGecko trending");
        const trendingIndex = trendingResponse.coins?.findIndex((coin) => coin.item?.id === coinGeckoId) ??
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
        tokenSymbol,
        coinGeckoId,
        mentionCount,
        mentionSpike: 0,
        trendingRank,
        source: SOURCE,
        rawData: {
            tokenSymbol,
            coinGeckoId,
            searchEndpoint: redactApiKey(searchEndpoint),
            trendingEndpoint: redactApiKey(trendingEndpoint),
            coinEndpoint: redactApiKey(coinEndpoint),
            searchResponse,
            trendingResponse,
            coinResponse,
        },
    };
}
