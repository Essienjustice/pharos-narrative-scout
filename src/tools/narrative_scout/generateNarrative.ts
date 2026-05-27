import "dotenv/config";
import OpenAI from "openai";
import type { PriceMovement as PriceData } from "./getPriceMovement.js";
import type { SocialSignals as SocialData } from "./getSocialSignals.js";
import type { TVLShift as TVLData } from "./getTVLShift.js";

const SYSTEM_PROMPT =
  "You are a sharp onchain analyst. You receive three data signals about a Pharos testnet token: social momentum, recent transaction activity, and latest block activity. Some fields use old market labels for compatibility, but txCount, avgGasPrice, latestBlock, blockTime, and txPerBlock are the primary activity signals. Treat currentPrice as average gas price, not a live token price. Treat TVL fields as block activity proxies, not real protocol TVL. If social data is unavailable, say so plainly without overstating it. Your job is to synthesize these into a 2-3 sentence plain-English narrative that explains what is happening and what it likely means, focusing on network activity signals instead of price and TVL. End with a single risk signal on its own line in this exact format - SIGNAL: BULLISH or SIGNAL: CAUTION or SIGNAL: BEARISH. Be direct, specific, and never generic. Never say 'it is important to' or 'this suggests'. Just state what is happening and what it means.";

export type NarrativeSignal = "BULLISH" | "CAUTION" | "BEARISH";

export interface GeneratedNarrative {
  narrative: string;
  signal: NarrativeSignal;
  generatedAt: string;
}

function parseNarrativeResponse(
  content: string,
): Pick<GeneratedNarrative, "narrative" | "signal"> {
  const signalMatch = content.match(
    /^\s*SIGNAL:\s*(BULLISH|CAUTION|BEARISH)\s*$/im,
  );

  if (!signalMatch) {
    return {
      narrative: content.trim(),
      signal: "CAUTION",
    };
  }

  return {
    narrative: content.replace(signalMatch[0], "").trim(),
    signal: signalMatch[1] as NarrativeSignal,
  };
}

function pluralize(value: number | null | undefined, singular: string): string {
  return value === 1 ? singular : `${singular}s`;
}

function fallbackNarrative(
  social: SocialData,
  price: PriceData,
  tvl: TVLData,
): Pick<GeneratedNarrative, "narrative" | "signal"> {
  const txText =
    price.txCount === null
      ? "recent SocialScan transaction activity is unavailable"
      : `${price.txCount} ${pluralize(
          price.txCount,
          "transaction",
        )} appeared across the latest sampled blocks`;
  const gasText =
    price.avgGasPrice === null
      ? "average gas price is unavailable"
      : `average gas price is ${price.avgGasPrice} gwei`;
  const blockText =
    tvl.latestBlock === null
      ? "latest block data is unavailable"
      : `latest block ${tvl.latestBlock} at ${
          tvl.blockTime ?? "unknown time"
        } carried ${tvl.txPerBlock ?? 0} ${pluralize(
          tvl.txPerBlock,
          "transaction",
        )}`;

  return {
    narrative: `PHRS has no live DEX price or indexed protocol TVL in this scout, so SocialScan network activity is the main read. ${txText}, ${gasText}, and ${blockText}; social indexing remains unavailable for this Pharos testnet asset.`,
    signal: social.mentionCount === 0 && !price.isActive ? "CAUTION" : "BULLISH",
  };
}

export async function generateNarrative(
  social: SocialData,
  price: PriceData,
  tvl: TVLData,
): Promise<GeneratedNarrative> {
  const generatedAt = new Date().toISOString();

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Here is the token data: ${JSON.stringify({
            social,
            price,
            tvl,
          })}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return {
        ...fallbackNarrative(social, price, tvl),
        generatedAt,
      };
    }

    return {
      ...parseNarrativeResponse(content),
      generatedAt,
    };
  } catch {
    return {
      ...fallbackNarrative(social, price, tvl),
      generatedAt,
    };
  }
}

export type { PriceData, SocialData, TVLData };
