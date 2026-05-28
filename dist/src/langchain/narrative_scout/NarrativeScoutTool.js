import { Tool } from "@langchain/core/tools";
import { generateNarrative, getPriceMovement, getSocialSignals, getTVLShift, } from "../../tools/narrative_scout/index.js";
export class NarrativeScoutTool extends Tool {
    constructor() {
        super(...arguments);
        this.name = "pharos_narrative_scout";
        this.description = "Analyzes a token by cross-referencing social signals, price movement, and TVL shift to generate a plain-English onchain narrative and risk signal. Input is a JSON string with fields: tokenSymbol (string), tokenAddress (string), protocolName (string).";
    }
    async _call(input) {
        const { tokenSymbol, tokenAddress, protocolName } = JSON.parse(input);
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
        return JSON.stringify({
            social,
            price,
            tvl,
            narrative,
        }, null, 2);
    }
}
