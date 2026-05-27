import "dotenv/config";
import { PharosAgentKit } from "pharos-agent-kit";
import type { generateNarrative } from "../src/tools/narrative_scout/generateNarrative.js";
import type { getPriceMovement } from "../src/tools/narrative_scout/getPriceMovement.js";
import type { getSocialSignals } from "../src/tools/narrative_scout/getSocialSignals.js";
import type { getTVLShift } from "../src/tools/narrative_scout/getTVLShift.js";

interface NarrativeScoutTools {
  generateNarrative: typeof generateNarrative;
  getPriceMovement: typeof getPriceMovement;
  getSocialSignals: typeof getSocialSignals;
  getTVLShift: typeof getTVLShift;
}

function formatValue(value: number | string | null | undefined): string {
  return value === null || value === undefined ? "null" : String(value);
}

function formatRank(value: number | null): string {
  return value === null ? "null" : `#${value}`;
}

function formatSocialLabel(source: string): string {
  return source === "CoinGecko Exchange Listings"
    ? "exchange listings"
    : "mentions";
}

function printUsage(): void {
  console.log(
    "Usage: ts-node scripts/scout.ts <tokenSymbol> <tokenAddress> <protocolName>",
  );
}

async function loadNarrativeScoutTools(): Promise<NarrativeScoutTools> {
  const sourceExtension = import.meta.url.endsWith(".ts") ? "ts" : "js";
  const [narrativeModule, priceModule, socialModule, tvlModule] =
    await Promise.all([
      import(
        `../src/tools/narrative_scout/generateNarrative.${sourceExtension}`
      ),
      import(
        `../src/tools/narrative_scout/getPriceMovement.${sourceExtension}`
      ),
      import(
        `../src/tools/narrative_scout/getSocialSignals.${sourceExtension}`
      ),
      import(`../src/tools/narrative_scout/getTVLShift.${sourceExtension}`),
    ]);

  return {
    generateNarrative: narrativeModule.generateNarrative,
    getPriceMovement: priceModule.getPriceMovement,
    getSocialSignals: socialModule.getSocialSignals,
    getTVLShift: tvlModule.getTVLShift,
  } as NarrativeScoutTools;
}

async function main(): Promise<void> {
  const [, , tokenSymbol, tokenAddress, protocolName] = process.argv;

  if (!tokenSymbol || !tokenAddress || !protocolName) {
    printUsage();
    process.exit(1);
  }

  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;

  if (!privateKey || !rpcUrl) {
    console.error("Missing PRIVATE_KEY or RPC_URL in .env");
    process.exit(1);
  }

  process.env.PHAROS_PRIVATE_KEY ??= privateKey;
  new PharosAgentKit(privateKey, rpcUrl, {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ELFA_AI_API_KEY: process.env.ELFA_API_KEY,
    COINGECKO_PRO_API_KEY: process.env.COINGECKO_API_KEY,
  });

  const { generateNarrative, getPriceMovement, getSocialSignals, getTVLShift } =
    await loadNarrativeScoutTools();

  const [social, price, tvl] = await Promise.all([
    getSocialSignals(tokenSymbol),
    getPriceMovement(tokenSymbol),
    getTVLShift(protocolName),
  ]);
  const narrative = await generateNarrative(social, price, tvl);

  console.log("=======================================");
  console.log("   PHAROS NARRATIVE SCOUT");
  console.log("   Network: Pharos Mainnet");
  console.log("   Chain ID: 1672");
  console.log("=======================================");
  console.log(`  Token:    ${tokenSymbol} (${tokenAddress})`);
  console.log(`  Protocol: ${protocolName}`);
  console.log("---------------------------------------");
  console.log(
    `   Social:  ${formatValue(social.mentionCount)} ${formatSocialLabel(
      social.source,
    )} - ${formatValue(
      social.mentionSpike,
    )}% spike - Rank ${formatRank(social.trendingRank)}`,
  );
  console.log(
    `   Price:   $${formatValue(price.currentPrice)} - ${formatValue(
      price.change24hr,
    )}% 24hr - volume $${formatValue(price.volume24hr)} - ${
      price.isTopGainer ? "TOP GAINER" : "NOT TOP GAINER"
    }`,
  );
  console.log(
    `   TVL:     $${formatValue(tvl.currentTVL)} - ${formatValue(
      tvl.tvlChange24hr,
    )}% 24hr`,
  );
  console.log("---------------------------------------");
  console.log(`   ${narrative.narrative}`);
  console.log("");
  console.log(`  Signal: ${narrative.signal}`);
  console.log("=======================================");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
