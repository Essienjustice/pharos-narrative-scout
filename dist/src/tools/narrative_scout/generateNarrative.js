import "dotenv/config";
import OpenAI from "openai";
const SYSTEM_PROMPT = "You are a sharp onchain analyst. You receive three data signals about a token: exchange-listing presence and CoinGecko trending rank, live CoinGecko price data, and DeFiLlama TVL movement. Include real price data in the narrative when currentPrice is available: USD price, 24 hour percentage change, and 24 hour volume if provided. Include TVL and 24 hour TVL change when available. If social proxy data, price data, or TVL data is unavailable, say so plainly without overstating it. Your job is to synthesize these into a 2-3 sentence plain-English narrative that explains what is happening and what it likely means. End with a single risk signal on its own line in this exact format - SIGNAL: BULLISH or SIGNAL: CAUTION or SIGNAL: BEARISH. Be direct, specific, and never generic. Never say 'it is important to' or 'this suggests'. Just state what is happening and what it means.";
function parseNarrativeResponse(content) {
    const signalMatch = content.match(/^\s*SIGNAL:\s*(BULLISH|CAUTION|BEARISH)\s*$/im);
    if (!signalMatch) {
        return {
            narrative: content.trim(),
            signal: "CAUTION",
        };
    }
    return {
        narrative: content.replace(signalMatch[0], "").trim(),
        signal: signalMatch[1],
    };
}
function pluralize(value, singular) {
    return value === 1 ? singular : `${singular}s`;
}
function fallbackNarrative(social, price, tvl) {
    const tokenLabel = price.tokenSymbol || social.tokenSymbol || "The token";
    const protocolLabel = tvl.protocolName || "The protocol";
    const priceText = price.currentPrice === null
        ? "live CoinGecko price data is unavailable"
        : `${tokenLabel} trades at $${price.currentPrice} with ${price.change24hr === null
            ? "unknown 24 hour change"
            : `${price.change24hr}% 24 hour change`} and ${price.volume24hr === null
            ? "unknown 24 hour volume"
            : `$${price.volume24hr} in 24 hour volume`}`;
    const blockText = tvl.currentTVL === null
        ? `${protocolLabel} TVL data is unavailable`
        : `${protocolLabel} TVL is $${tvl.currentTVL} with ${tvl.tvlChange24hr === null
            ? "unknown"
            : `${tvl.tvlChange24hr}%`} 24 hour TVL change`;
    return {
        narrative: `${priceText}. ${blockText}; CoinGecko lists ${tokenLabel} on ${social.mentionCount} ticker markets and its trending rank is ${social.trendingRank === null ? "unavailable" : `#${social.trendingRank}`}.`,
        signal: price.change24hr !== null && price.change24hr < -10
            ? "BEARISH"
            : social.mentionCount === 0 && !price.isActive
                ? "CAUTION"
                : "BULLISH",
    };
}
export async function generateNarrative(social, price, tvl) {
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
    }
    catch {
        return {
            ...fallbackNarrative(social, price, tvl),
            generatedAt,
        };
    }
}
