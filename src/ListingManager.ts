import { ponder } from "ponder:registry";
import { listing, rentalHistory } from "../ponder.schema";

// When a new listing is created on the marketplace
ponder.on("ListingManager:ListingCreated", async ({ event, context }) => {
    const { listingId, nfa, tokenId, pricePerDay, minDays } = event.args;

    // Try to read agent metadata for the name
    let agentName = "Unknown Agent";
    try {
        const metadata = await context.client.readContract({
            abi: context.contracts.AgentNFA.abi,
            address: context.contracts.AgentNFA.address!,
            functionName: "getAgentMetadata",
            args: [tokenId],
        });
        if (metadata?.persona) {
            const parsed = JSON.parse(metadata.persona);
            agentName = parsed.name || parsed.role || "Agent";
        }
    } catch {
        // Metadata read failed, use default
    }

    await context.db
        .insert(listing)
        .values({
            id: listingId,
            nfa,
            tokenId,
            owner: event.transaction.from,
            pricePerDay: BigInt(pricePerDay),
            minDays: Number(minDays),
            active: true,
            agentName,
            createdAt: event.block.timestamp,
            updatedAt: event.block.timestamp,
        })
        .onConflictDoUpdate({
            active: true,
            pricePerDay: BigInt(pricePerDay),
            minDays: Number(minDays),
            agentName,
            updatedAt: event.block.timestamp,
        });
});

// When an agent is rented
ponder.on("ListingManager:AgentRented", async ({ event, context }) => {
    const { listingId, renter, expires, totalPaid } = event.args;

    // Update listing with rental info
    await context.db
        .update(listing, { id: listingId })
        .set({
            renter,
            expires: BigInt(expires),
            updatedAt: event.block.timestamp,
        });

    // Record rental history
    await context.db
        .insert(rentalHistory)
        .values({
            id: `${event.transaction.hash}-${event.log.logIndex}`,
            listingId,
            renter,
            expires: BigInt(expires),
            totalPaid,
            eventType: "rent",
            timestamp: event.block.timestamp,
            blockNumber: event.block.number,
        });
});

// When a lease is extended
ponder.on("ListingManager:LeaseExtended", async ({ event, context }) => {
    const { listingId, renter, newExpires, totalPaid } = event.args;

    // Update listing with new expiry
    await context.db
        .update(listing, { id: listingId })
        .set({
            expires: BigInt(newExpires),
            updatedAt: event.block.timestamp,
        });

    // Record extension history
    await context.db
        .insert(rentalHistory)
        .values({
            id: `${event.transaction.hash}-${event.log.logIndex}`,
            listingId,
            renter,
            expires: BigInt(newExpires),
            totalPaid,
            eventType: "extend",
            timestamp: event.block.timestamp,
            blockNumber: event.block.number,
        });
});

// When a listing is canceled
ponder.on("ListingManager:ListingCanceled", async ({ event, context }) => {
    const { listingId } = event.args;

    await context.db
        .update(listing, { id: listingId })
        .set({
            active: false,
            updatedAt: event.block.timestamp,
        });
});
