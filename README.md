# Pharos Narrative Scout

[![Pharos Agent Kit](https://img.shields.io/badge/Pharos-Agent%20Kit-2f6fed)](https://github.com/pharos-agent-kit/pharos-agent-kit)

Pharos Narrative Scout is a TypeScript skill for generating a concise onchain narrative from social momentum, token price action, and protocol TVL movement.

## What The Skill Does

The skill fetches CoinGecko exchange listing count and trending rank as social signals, live PROS price data from CoinGecko, and Pharos TVL from DeFiLlama, then uses GPT-4o to synthesize a 2-3 sentence analyst narrative with a BULLISH / CAUTION / BEARISH risk signal.

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
=======================================
   PHAROS NARRATIVE SCOUT
   Network: Pharos Mainnet
   Chain ID: 1672
=======================================
  Token:    PROS (pros)
  Protocol: pharos
---------------------------------------
   Social:  42 exchange listings - 0% spike - Rank #7
   Price:   $0.0348 - 6.4% 24hr - volume $1,284,900 - NOT TOP GAINER
   TVL:     $12,450,000 - 3.1% 24hr
---------------------------------------
   PROS is trading higher with active exchange coverage and a visible CoinGecko trending position, while 24 hour volume shows enough liquidity to make the move worth monitoring. Pharos TVL is also rising over the same window, giving the price strength some supporting network context.

  Signal: BULLISH
=======================================
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
