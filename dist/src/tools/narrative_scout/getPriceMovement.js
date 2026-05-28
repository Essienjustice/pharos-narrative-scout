const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";
const COINGECKO_SEARCH_URL = "https://api.coingecko.com/api/v3/search";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "CG-itm1SEKJTc6pg9f9N8qk2BR2";
const SOURCE = "CoinGecko";
function errorSummary(error) {
    if (!(error instanceof Error)) {
        return error;
    }
    return {
        name: error.name,
        message: error.message,
    };
}
function asNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function withApiKey(url) {
    url.searchParams.set("x_cg_demo_api_key", COINGECKO_API_KEY);
    return url.toString();
}
function buildSearchUrl(tokenSymbol) {
    const url = new URL(COINGECKO_SEARCH_URL);
    url.searchParams.set("query", tokenSymbol);
    return withApiKey(url);
}
function buildCoinGeckoUrl(coinGeckoId) {
    const url = new URL(COINGECKO_PRICE_URL);
    url.searchParams.set("ids", coinGeckoId);
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_24hr_change", "true");
    url.searchParams.set("include_24hr_vol", "true");
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
export async function getPriceMovement(tokenSymbol) {
    const searchEndpoint = buildSearchUrl(tokenSymbol);
    const redactedSearchEndpoint = redactApiKey(searchEndpoint);
    try {
        const searchResponse = await fetchJson(searchEndpoint, "CoinGecko search");
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
        const response = await fetchJson(priceEndpoint, "CoinGecko price");
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
    }
    catch (error) {
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
