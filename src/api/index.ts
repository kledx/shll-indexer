import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { cors } from "hono/cors";
import { desc, eq } from "ponder";

const app = new Hono();

// Enable CORS for frontend access
app.use(
    "*",
    cors({
        origin: "*",
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
    })
);

// Ponder SQL client
app.use("/sql/*", client({ db, schema }));

// GraphQL endpoints
app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

// --- Custom REST API endpoints ---

// GET /api/listings - All active listings
app.get("/api/listings", async (c) => {
    const listings = await db
        .select()
        .from(schema.listing)
        .where(eq(schema.listing.active, true))
        .orderBy(desc(schema.listing.createdAt));

    return c.json({
        items: listings.map((l) => ({
            ...l,
            // Serialize bigints as strings for JSON compatibility
            tokenId: l.tokenId.toString(),
            pricePerDay: l.pricePerDay.toString(),
            expires: l.expires?.toString() ?? null,
            createdAt: l.createdAt.toString(),
            updatedAt: l.updatedAt.toString(),
        })),
        count: listings.length,
    });
});

// GET /api/agents - All minted agents
app.get("/api/agents", async (c) => {
    const agents = await db
        .select()
        .from(schema.agent)
        .orderBy(desc(schema.agent.createdAt));

    return c.json({
        items: agents.map((a) => ({
            ...a,
            tokenId: a.tokenId.toString(),
            createdAt: a.createdAt.toString(),
        })),
        count: agents.length,
    });
});

// GET /api/rentals/:address - Rental history by renter address
app.get("/api/rentals/:address", async (c) => {
    const address = c.req.param("address").toLowerCase() as `0x${string}`;
    const rentals = await db
        .select()
        .from(schema.rentalHistory)
        .where(eq(schema.rentalHistory.renter, address))
        .orderBy(desc(schema.rentalHistory.timestamp));

    return c.json({
        items: rentals.map((r) => ({
            ...r,
            expires: r.expires.toString(),
            totalPaid: r.totalPaid.toString(),
            timestamp: r.timestamp.toString(),
            blockNumber: r.blockNumber.toString(),
        })),
        count: rentals.length,
    });
});

export default app;
