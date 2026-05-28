const DEFILLAMA_PROTOCOLS_URL = "https://api.llama.fi/protocols";
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
async function fetchJson(endpoint, label) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new Error(`${label} failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`);
        }
        return (await response.json());
    }
    catch (error) {
        throw error instanceof Error
            ? error
            : new Error(`${label} failed: ${String(error)}`);
    }
}
function calculateTvlChange(currentTVL, previousTVL) {
    if (previousTVL === 0) {
        return 0;
    }
    return ((currentTVL - previousTVL) / previousTVL) * 100;
}
async function fetchProtocols() {
    const response = await fetchJson(DEFILLAMA_PROTOCOLS_URL, "DeFiLlama protocols");
    if (!Array.isArray(response)) {
        throw new Error("DeFiLlama protocols response was not an array");
    }
    return response;
}
function findProtocol(protocols, protocolName) {
    const normalizedProtocolName = protocolName.toLowerCase();
    return (protocols.find((protocol) => {
        const name = typeof protocol.name === "string" ? protocol.name.toLowerCase() : "";
        const slug = typeof protocol.slug === "string" ? protocol.slug.toLowerCase() : "";
        return (name.includes(normalizedProtocolName) ||
            slug.includes(normalizedProtocolName));
    }) ?? null);
}
export async function getTVLShift(protocolName) {
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
            protocolName: typeof protocol.name === "string" ? protocol.name : protocolName,
            protocolSlug: typeof protocol.slug === "string" ? protocol.slug : null,
            currentTVL,
            tvlChange24hr: currentTVL === null || previousTVL === null
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
    }
    catch (error) {
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
