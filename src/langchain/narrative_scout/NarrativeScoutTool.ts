import { Tool } from "@langchain/core/tools";
import {
  generateNarrative,
  getPriceMovement,
  getSocialSignals,
  getTVLShift,
} from "../../tools/narrative_scout/index.js";

interface NarrativeScoutInput {
  tokenSymbol: string;
  tokenAddress: string;
  protocolName: string;
}

export class NarrativeScoutTool extends Tool {
  name = "pharos_narrative_scout";

  description =
    "Analyzes a Pharos token by cross-referencing social signals, price movement, and TVL shift to generate a plain-English onchain narrative and risk signal. Input is a JSON string with fields: tokenSymbol (string), tokenAddress (string), protocolName (string).";

  protected async _call(input: string): Promise<string> {
    const { tokenSymbol, tokenAddress, protocolName } = JSON.parse(
      input,
    ) as NarrativeScoutInput;

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

    return JSON.stringify(
      {
        social,
        price,
        tvl,
        narrative,
      },
      null,
      2,
    );
  }
}
