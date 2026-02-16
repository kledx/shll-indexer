import { ponder } from "ponder:registry";
import { policy, actionRule, groupMember, instanceConfig, spendHistory } from "../ponder.schema";
import { decodeAbiParameters } from "viem";

// InstanceParams struct ABI for decoding paramsPacked bytes
const InstanceParamsAbi = [
    {
        type: "tuple",
        name: "params",
        components: [
            { name: "slippageBps", type: "uint16" },
            { name: "tradeLimit", type: "uint96" },
            { name: "dailyLimit", type: "uint96" },
            { name: "tokenGroupId", type: "uint32" },
            { name: "dexGroupId", type: "uint32" },
            { name: "riskTier", type: "uint8" },
        ],
    },
] as const;

// ═══════════════════════════════════════════════════════════
//                    POLICY EVENTS
// ═══════════════════════════════════════════════════════════

ponder.on("PolicyGuardV3:PolicyCreated", async ({ event, context }) => {
    const { policyId, version, policyModules } = event.args;

    // Fetch detailed schema from contract
    let schema;
    try {
        schema = await context.client.readContract({
            abi: context.contracts.PolicyGuardV3.abi,
            address: context.contracts.PolicyGuardV3.address,
            functionName: "getSchema",
            args: [policyId, version],
        });
    } catch (e) {
        console.error("Failed to fetch schema for policy", policyId, version, e);
        schema = null;
    }

    await context.db.insert(policy).values({
        id: `${policyId}-${version}`,
        policyId: Number(policyId),
        version: Number(version),
        maxSlippageBps: schema?.maxSlippageBps ?? null,
        maxTradeLimit: schema?.maxTradeLimit ?? null,
        maxDailyLimit: schema?.maxDailyLimit ?? null,
        allowedTokenGroups: schema ? JSON.stringify(schema.allowedTokenGroups.map(Number)) : null,
        allowedDexGroups: schema ? JSON.stringify(schema.allowedDexGroups.map(Number)) : null,
        receiverMustBeVault: schema?.receiverMustBeVault ?? null,
        forbidInfiniteApprove: schema?.forbidInfiniteApprove ?? null,
        isFrozen: false,
        createdAt: event.block.timestamp,
    }).onConflictDoUpdate({
        maxSlippageBps: schema?.maxSlippageBps ?? null,
        maxTradeLimit: schema?.maxTradeLimit ?? null,
        maxDailyLimit: schema?.maxDailyLimit ?? null,
        allowedTokenGroups: schema ? JSON.stringify(schema.allowedTokenGroups.map(Number)) : null,
        allowedDexGroups: schema ? JSON.stringify(schema.allowedDexGroups.map(Number)) : null,
        receiverMustBeVault: schema?.receiverMustBeVault ?? null,
        forbidInfiniteApprove: schema?.forbidInfiniteApprove ?? null,
    });
});

ponder.on("PolicyGuardV3:ActionRuleSet", async ({ event, context }) => {
    const { policyId, version, target, selector, moduleMask } = event.args;
    await context.db.insert(actionRule).values({
        id: `${policyId}-${version}-${target}-${selector}`,
        policyId: Number(policyId),
        version: Number(version),
        target,
        selector,
        moduleMask,
    }).onConflictDoUpdate({
        moduleMask,
    });
});

ponder.on("PolicyGuardV3:PolicyFrozen", async ({ event, context }) => {
    const { policyId, version } = event.args;
    await context.db.update(policy, { id: `${policyId}-${version}` }).set({
        isFrozen: true,
    });
});

// ═══════════════════════════════════════════════════════════
//                    GROUP EVENTS
// ═══════════════════════════════════════════════════════════

ponder.on("PolicyGuardV3:GroupMemberSet", async ({ event, context }) => {
    const { groupId, member, allowed } = event.args;
    await context.db.insert(groupMember).values({
        id: `${groupId}-${member}`,
        type: "generic",
        groupId: Number(groupId),
        address: member,
        allowed,
        updatedAt: event.block.timestamp,
    }).onConflictDoUpdate({
        allowed,
        updatedAt: event.block.timestamp,
    });
});

// ═══════════════════════════════════════════════════════════
//                    INSTANCE CONFIG EVENTS
// ═══════════════════════════════════════════════════════════

ponder.on("PolicyGuardV3:InstanceConfigBound", async ({ event, context }) => {
    const { instanceId, policyId, version, paramsHash } = event.args;

    // Fetch paramsPacked from contract
    let paramsPacked: `0x${string}` = "0x";
    let slippageBps = 0;
    let tradeLimit = 0n;
    let dailyLimit = 0n;
    let tokenGroupId = 0;
    let dexGroupId = 0;
    let riskTier = 0;

    try {
        const result = await context.client.readContract({
            abi: context.contracts.PolicyGuardV3.abi,
            address: context.contracts.PolicyGuardV3.address,
            functionName: "getInstanceParams",
            args: [instanceId],
        });
        paramsPacked = result[1] as `0x${string}`;

        if (paramsPacked && paramsPacked !== "0x") {
            const [params] = decodeAbiParameters(InstanceParamsAbi, paramsPacked);
            slippageBps = params.slippageBps;
            tradeLimit = params.tradeLimit;
            dailyLimit = params.dailyLimit;
            tokenGroupId = params.tokenGroupId;
            dexGroupId = params.dexGroupId;
            riskTier = params.riskTier;
        }
    } catch (e) {
        console.error("Failed to fetch/decode instance params for", instanceId, e);
    }

    await context.db.insert(instanceConfig).values({
        id: instanceId,
        policyId: Number(policyId),
        version: Number(version),
        paramsPacked,
        paramsHash,
        slippageBps,
        tradeLimit,
        dailyLimit,
        tokenGroupId,
        dexGroupId,
        riskTier,
        updatedAt: event.block.timestamp,
    }).onConflictDoUpdate({
        policyId: Number(policyId),
        version: Number(version),
        paramsPacked,
        paramsHash,
        slippageBps,
        tradeLimit,
        dailyLimit,
        tokenGroupId,
        dexGroupId,
        riskTier,
        updatedAt: event.block.timestamp,
    });
});

ponder.on("PolicyGuardV3:ParamsUpdated", async ({ event, context }) => {
    const { instanceId, newVersion, paramsHash } = event.args;

    // Re-fetch params after update
    let paramsPacked: `0x${string}` = "0x";
    let slippageBps = 0;
    let tradeLimit = 0n;
    let dailyLimit = 0n;
    let tokenGroupId = 0;
    let dexGroupId = 0;
    let riskTier = 0;

    try {
        const result = await context.client.readContract({
            abi: context.contracts.PolicyGuardV3.abi,
            address: context.contracts.PolicyGuardV3.address,
            functionName: "getInstanceParams",
            args: [instanceId],
        });
        paramsPacked = result[1] as `0x${string}`;

        if (paramsPacked && paramsPacked !== "0x") {
            const [params] = decodeAbiParameters(InstanceParamsAbi, paramsPacked);
            slippageBps = params.slippageBps;
            tradeLimit = params.tradeLimit;
            dailyLimit = params.dailyLimit;
            tokenGroupId = params.tokenGroupId;
            dexGroupId = params.dexGroupId;
            riskTier = params.riskTier;
        }
    } catch (e) {
        console.error("Failed to fetch/decode updated params for", instanceId, e);
    }

    await context.db.update(instanceConfig, { id: instanceId }).set({
        paramsPacked,
        paramsHash,
        slippageBps,
        tradeLimit,
        dailyLimit,
        tokenGroupId,
        dexGroupId,
        riskTier,
        updatedAt: event.block.timestamp,
    });
});

// ═══════════════════════════════════════════════════════════
//                    SPEND TRACKING
// ═══════════════════════════════════════════════════════════

ponder.on("PolicyGuardV3:Spent", async ({ event, context }) => {
    const { instanceId, amount, dayIndex } = event.args;
    await context.db.insert(spendHistory).values({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        instanceId,
        amount,
        dayIndex: Number(dayIndex),
        txHash: event.transaction.hash,
        timestamp: event.block.timestamp,
    });
});
