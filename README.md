# Pharos Narrative Scout

[![Pharos Agent Kit](https://img.shields.io/badge/Pharos-Agent%20Kit-2f6fed)](https://github.com/pharos-agent-kit/pharos-agent-kit)

Pharos Narrative Scout is a TypeScript skill for generating a concise onchain narrative from social momentum, token price action, and protocol TVL movement.

## What The Skill Does

The skill accepts a token symbol, token address, and protocol name. It fetches social placeholder data plus Pharos Mainnet transaction and block activity from SocialScan, then asks OpenAI to synthesize the result into a 2-3 sentence narrative with a normalized risk signal.

## Why It's Unique

Pharos Narrative Scout is the first skill to cross-reference social + price + TVL simultaneously. Instead of treating market movement, mentions, and protocol liquidity as separate dashboards, it turns them into one readable analyst narrative.

## Installation

```bash
git clone <repo-url>
cd pharos-narrative-scout
npm install
```

Build the TypeScript project:

```bash
npm run build
```

## Environment Setup

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Fill in the required values:

```env
PRIVATE_KEY=
OPENAI_API_KEY=
COINGECKO_API_KEY=
ELFA_API_KEY=
NETWORK=mainnet
RPC_URL=https://rpc.pharos.network
```

Network:

- Pharos Mainnet
- Chain ID: `1672`

## How To Run

```bash
npm run scout -- PROS pros pharos
```

## Example Terminal Output

```text
═══════════════════════════════════════
   PHAROS NARRATIVE SCOUT
═══════════════════════════════════════
  Token:    PROS (pros)
  Protocol: pharos
───────────────────────────────────────
   Social:  184 mentions · 42.7% spike · Rank #6
   Price:   12.4% (24hr) · TOP GAINER
   TVL:     8.9% shift · $12450000
───────────────────────────────────────
   PROS is drawing fresh attention as smart mentions accelerate and mainnet activity confirms users are engaging with the network. Block activity is expanding alongside the move, pointing to real usage behind the social momentum instead of a purely speculative spike.

  Signal: BULLISH
═══════════════════════════════════════
```

## How It Works

Architecture overview:

1. `scripts/scout.ts` reads CLI arguments and environment variables.
2. `getSocialSignals` pulls CoinGecko market volume as a social proxy plus CoinGecko trending rank.
3. `getPriceMovement` pulls live PROS price, 24 hour change, and 24 hour volume from CoinGecko.
4. `getTVLShift` pulls Pharos TVL from DeFiLlama with a chains-list fallback.
5. `generateNarrative` sends the normalized data to OpenAI using `gpt-4o`.
6. LangChain and pharos-agent-kit action wrappers expose the same workflow for agent runtimes.

## Dependencies

| Dependency | Purpose |
| --- | --- |
| `pharos-agent-kit` | Pharos integrations and agent framework primitives. |
| `openai` | Chat completions for narrative generation. |
| `zod` | Action input schema validation. |
| `dotenv` | Environment variable loading. |
| `@langchain/core` | LangChain tool integration. |
| `typescript` | Strict TypeScript compilation. |
| `ts-node` | Local TypeScript CLI execution. |

## License

Apache-2.0
