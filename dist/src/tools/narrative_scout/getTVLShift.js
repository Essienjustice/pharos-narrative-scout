const SOCIALSCAN_API_KEY = "102dfc05-661d-4efd-a81e-24afb3918c7f";
const SOCIALSCAN_BLOCKS_URL = "https://api.socialscan.io/pharos-testnet/v1/explorer/blocks";
const SOURCE = "SocialScan Pharos Testnet";
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
    const numberValue = typeof value === "number"
        ? value
        : typeof value === "string"
            ? Number(value)
            : Number.NaN;
    return Number.isFinite(numberValue) ? numberValue : null;
}
function asString(value) {
    return typeof value === "string" && value.length > 0 ? value : null;
}
function buildBlocksUrl() {
    const url = new URL(SOCIALSCAN_BLOCKS_URL);
    url.searchParams.set("size", "1");
    url.searchParams.set("page", "1");
    url.searchParams.set("apikey", SOCIALSCAN_API_KEY);
    return url.toString();
}
async function fetchLatestBlock() {
    const endpoint = buildBlocksUrl();
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`SocialScan blocks failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json());
}
export async function getTVLShift(protocolName) {
    const endpoint = buildBlocksUrl();
    try {
        const response = await fetchLatestBlock();
        const latestBlockData = response.data?.[0] ?? null;
        const latestBlock = asNumber(latestBlockData?.number ?? latestBlockData?.block_number);
        const blockTime = asString(latestBlockData?.timestamp) ??
            asString(latestBlockData?.block_timestamp);
        const txPerBlock = asNumber(latestBlockData?.transactions_count ?? latestBlockData?.transaction_count);
        return {
            currentTVL: null,
            tvlChange24hr: 0,
            tvlProxy: txPerBlock,
            latestBlock,
            blockTime,
            txPerBlock,
            source: SOURCE,
            rawData: {
                protocolName,
                endpoint,
                response,
                note: "Pharos testnet protocol TVL is not indexed yet, so latest-block transaction count is used as a network activity proxy.",
            },
        };
    }
    catch (error) {
        console.error("[getTVLShift] failed:", errorSummary(error));
        return {
            currentTVL: null,
            tvlChange24hr: 0,
            tvlProxy: null,
            latestBlock: null,
            blockTime: null,
            txPerBlock: null,
            source: SOURCE,
            rawData: {
                protocolName,
                endpoint,
                error: errorSummary(error),
            },
        };
    }
}
