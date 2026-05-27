# Pharos Narrative Scout

## Short Description

Pharos Narrative Scout analyzes a Pharos token by combining social momentum, price movement, and TVL shift into a plain-English onchain narrative with a risk signal.

## What It Does

This skill cross-references three market and protocol signals:

- Social signals from Elfa AI, including mention count, mention spike, and trending rank.
- Live PROS price movement from CoinGecko, including USD price, 24 hour percentage change, 24 hour volume, and top-gainer status.
- Block activity from SocialScan Pharos Mainnet blocks, including latest block, block time, and transactions per block.

It then uses OpenAI to generate a short analyst-style narrative and one normalized signal: `BULLISH`, `CAUTION`, or `BEARISH`.

## Inputs

| Field | Type | Description |
| --- | --- | --- |
| `tokenSymbol` | `string` | Token ticker or symbol, such as `PROS`. |
| `tokenAddress` | `string` | Token contract address. |
| `protocolName` | `string` | Protocol name or chain slug, such as `pharos`. |

## Example Input

```json
{
  "tokenSymbol": "PROS",
  "tokenAddress": "pros",
  "protocolName": "pharos"
}
```

## Example Output

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

## Supported Frameworks

- LangChain
- Vercel AI SDK
- MCP

## Dependencies

- `pharos-agent-kit`
- `openai`
- `zod`
- `dotenv`

## Network

- Pharos Mainnet
- Chain ID: `1672`
