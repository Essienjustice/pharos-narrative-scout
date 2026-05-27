export async function getSocialSignals(tokenSymbol) {
    return {
        mentionCount: 0,
        mentionSpike: 0,
        trendingRank: null,
        source: "unavailable",
        rawData: {
            tokenSymbol,
            note: "Social indexing for Pharos testnet tokens is not yet available on third-party APIs.",
        },
    };
}
