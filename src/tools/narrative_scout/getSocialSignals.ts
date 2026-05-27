export interface SocialSignals {
  mentionCount: number | null;
  mentionSpike: number | null;
  trendingRank: number | null;
  source: string;
  rawData: unknown | null;
}

export async function getSocialSignals(
  tokenSymbol: string,
): Promise<SocialSignals> {
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
