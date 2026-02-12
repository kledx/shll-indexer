import { ponder } from "ponder:registry";
import { agent } from "../ponder.schema";

// When a new agent NFT is minted
ponder.on("AgentNFA:AgentMinted", async ({ event, context }) => {
    const { tokenId, owner, account, policyId } = event.args;

    await context.db
        .insert(agent)
        .values({
            id: tokenId.toString(),
            tokenId,
            owner,
            account,
            policyId,
            createdAt: event.block.timestamp,
        })
        .onConflictDoNothing();
});
