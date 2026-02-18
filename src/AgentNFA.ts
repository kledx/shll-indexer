import { ponder } from "ponder:registry";
import { agent, executionHistory } from "../ponder.schema";

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

// Track execute() activity for console timeline and auditing.
ponder.on("AgentNFA:Executed", async ({ event, context }) => {
    const { tokenId, caller, account, target, selector, success, result } = event.args;

    await context.db
        .insert(executionHistory)
        .values({
            id: `${event.transaction.hash}-${event.log.logIndex}`,
            tokenId,
            caller,
            account,
            target,
            selector,
            success,
            result,
            txHash: event.transaction.hash,
            logIndex: Number(event.log.logIndex),
            blockNumber: event.block.number,
            timestamp: event.block.timestamp,
        })
        .onConflictDoNothing();
});

// V1.3: When a template is registered
ponder.on("AgentNFA:TemplateListed", async ({ event, context }) => {
    const { tokenId } = event.args;

    await context.db
        .update(agent, { id: tokenId.toString() })
        .set({ isTemplate: true });
});

// V1.3: When an instance is minted from a template
ponder.on("AgentNFA:InstanceMinted", async ({ event, context }) => {
    const { templateId, instanceId, owner, account } = event.args;

    await context.db
        .insert(agent)
        .values({
            id: instanceId.toString(),
            tokenId: instanceId,
            owner,
            account,
            policyId: "0x" as `0x${string}`, // Will be populated by AgentMinted if also emitted
            isTemplate: false,
            templateId,
            createdAt: event.block.timestamp,
        })
        .onConflictDoUpdate({
            isTemplate: false,
            templateId,
        });
});

// V3.0: When an agent's type is set or updated
ponder.on("AgentNFA:AgentTypeSet", async ({ event, context }) => {
    const { tokenId, agentType } = event.args;
    // Decode bytes32 → trimmed ASCII string (e.g. "dca", "llm_trader")
    const hex = (agentType as string).replace(/0+$/, "");
    let decoded = "unknown";
    if (hex.length > 2) {
        const buf = Buffer.from(hex.slice(2), "hex");
        decoded = buf.toString("utf8").replace(/\0/g, "");
    }

    await context.db
        .update(agent, { id: tokenId.toString() })
        .set({ agentType: decoded });
});

