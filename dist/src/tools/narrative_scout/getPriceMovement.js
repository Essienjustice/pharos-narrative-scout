const SOCIALSCAN_API_KEY = "102dfc05-661d-4efd-a81e-24afb3918c7f";
const SOCIALSCAN_TRANSACTIONS_URL = "https://api.socialscan.io/pharos-testnet/v1/explorer/transactions";
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
function buildTransactionsUrl() {
    const url = new URL(SOCIALSCAN_TRANSACTIONS_URL);
    url.searchParams.set("size", "10");
    url.searchParams.set("page", "1");
    url.searchParams.set("apikey", SOCIALSCAN_API_KEY);
    return url.toString();
}
async function fetchLatestTransactions() {
    const endpoint = buildTransactionsUrl();
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`SocialScan transactions failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json());
}
function getGasPrice(transaction) {
    const gweiPrice = asNumber(transaction.gas_price_gwei);
    if (gweiPrice !== null) {
        return gweiPrice;
    }
    const weiPrice = asNumber(transaction.gas_price ?? transaction.gasPrice);
    return weiPrice === null ? null : weiPrice / 1000000000;
}
function average(values) {
    if (values.length === 0) {
        return null;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
export async function getPriceMovement(tokenSymbol) {
    const endpoint = buildTransactionsUrl();
    try {
        const response = await fetchLatestTransactions();
        const latestTransactions = response.data ?? [];
        const latestBlock = latestTransactions.reduce((currentLatest, transaction) => {
            const blockNumber = asNumber(transaction.block_number);
            if (blockNumber === null) {
                return currentLatest;
            }
            return currentLatest === null
                ? blockNumber
                : Math.max(currentLatest, blockNumber);
        }, null);
        const tenBlockFloor = latestBlock === null ? null : Math.max(0, latestBlock - 9);
        const recentTransactions = tenBlockFloor === null
            ? latestTransactions
            : latestTransactions.filter((transaction) => {
                const blockNumber = asNumber(transaction.block_number);
                return blockNumber !== null && blockNumber >= tenBlockFloor;
            });
        const txCount = recentTransactions.length;
        const gasPrices = recentTransactions
            .map(getGasPrice)
            .filter((gasPrice) => gasPrice !== null);
        const avgGasPrice = average(gasPrices);
        return {
            currentPrice: avgGasPrice,
            change24hr: 0,
            isTopGainer: false,
            txCount,
            avgGasPrice,
            isActive: txCount > 0,
            source: SOURCE,
            rawData: {
                tokenSymbol,
                endpoint,
                latestBlock,
                tenBlockFloor,
                response,
                note: "PHRS is a Pharos testnet token, so average gas price from recent SocialScan transactions is used as the activity and demand proxy.",
            },
        };
    }
    catch (error) {
        console.error("[getPriceMovement] failed:", errorSummary(error));
        return {
            currentPrice: null,
            change24hr: 0,
            isTopGainer: false,
            txCount: null,
            avgGasPrice: null,
            isActive: false,
            source: SOURCE,
            rawData: {
                tokenSymbol,
                endpoint,
                error: errorSummary(error),
            },
        };
    }
}
