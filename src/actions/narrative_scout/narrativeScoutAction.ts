import type { Action } from "pharos-agent-kit";
import { z } from "zod";
import {
  generateNarrative,
  getPriceMovement,
  getSocialSignals,
  getTVLShift,
} from "../../tools/narrative_scout/index.js";

const narrativeScoutAction: Action = {
  name: "PHAROS_NARRATIVE_SCOUT",
  similes: [
    "analyze token",
    "scout narrative",
    "what is the story on",
    "onchain analysis",
  ],
  description:
    "Analyzes a Pharos token by cross-referencing social signals, price movement, and TVL shift to generate a plain-English onchain narrative and risk signal.",
  examples: [],
  schema: z.object({
    tokenSymbol: z.string().min(1),
    tokenAddress: z.string().min(1),
    protocolName: z.string().min(1),
  }),
  handler: async (_agent, input) => {
    try {
      const tokenSymbol = String(input.tokenSymbol);
      const tokenAddress = String(input.tokenAddress);
      const protocolName = String(input.protocolName);

      const socialPromise = getSocialSignals(tokenSymbol);
      const pricePromise = getPriceMovement(tokenSymbol);
      const tvlPromise = getTVLShift(protocolName);
      const narrativePromise = Promise.all([
        socialPromise,
        pricePromise,
        tvlPromise,
      ]).then(([social, price, tvl]) => generateNarrative(social, price, tvl));

      const [social, price, tvl, narrative] = await Promise.all([
        socialPromise,
        pricePromise,
        tvlPromise,
        narrativePromise,
      ]);

      return {
        status: "success",
        data: {
          social,
          price,
          tvl,
          narrative,
        },
        message: "Narrative scout analysis generated successfully",
      };
    } catch (error) {
      return {
        status: "error",
        data: null,
        message:
          error instanceof Error
            ? error.message
            : "Narrative scout analysis failed",
      };
    }
  },
};

export default narrativeScoutAction;
