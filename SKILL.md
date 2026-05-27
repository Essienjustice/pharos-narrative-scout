# Pharos Narrative Scout

## Short Description

Pharos Narrative Scout analyzes a Pharos token by combining social momentum, price movement, and TVL shift into a plain-English onchain narrative with a risk signal.

## What It Does

This skill cross-references three market and protocol signals:

- Social signals from Elfa AI, including mention count, mention spike, and trending rank.
- Price movement from CoinGecko, including current price, 24 hour change, and top-gainer status.
- TVL shift from DeFiLlama, including current TVL and 24 hour TVL change.

It then uses OpenAI to generate a short analyst-style narrative and one normalized signal: `BULLISH`, `CAUTION`, or `BEARISH`.

## Inputs

| Field | Type | Description |
| --- | --- | --- |
| `tokenSymbol` | `string` | Token ticker or symbol, such as `PHRS`. |
| `tokenAddress` | `string` | Token contract address. |
| `protocolName` | `string` | Protocol name or DeFiLlama protocol slug. |

## Example Input

```json
{
  "tokenSymbol": "PHRS",
  "tokenAddress": "0x0000000000000000000000000000000000000000",
  "protocolName": "pharos"
}
```

## Example Output

```text
═══════════════════════════════════════
   PHAROS NARRATIVE SCOUT
═══════════════════════════════════════
  Token:    PHRS (0x0000000000000000000000000000000000000000)
  Protocol: pharos
───────────────────────────────────────
   Social:  184 mentions · 42.7% spike · Rank #6
   Price:   12.4% (24hr) · TOP GAINER
   TVL:     8.9% shift · $12450000
───────────────────────────────────────
   PHRS is drawing fresh attention as smart mentions accelerate and price action confirms buyers are chasing the move. TVL is expanding alongside the rally, pointing to real protocol usage behind the social momentum instead of a purely speculative spike.

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

- Pharos Atlantic Testnet
- Chain ID: `688688`
