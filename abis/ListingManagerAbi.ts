export const ListingManagerAbi = [
    {
        type: "event",
        name: "ListingCreated",
        inputs: [
            { name: "listingId", type: "bytes32", indexed: true },
            { name: "nfa", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "pricePerDay", type: "uint96", indexed: false },
            { name: "minDays", type: "uint32", indexed: false },
        ],
    },
    {
        type: "event",
        name: "AgentRented",
        inputs: [
            { name: "listingId", type: "bytes32", indexed: true },
            { name: "renter", type: "address", indexed: true },
            { name: "expires", type: "uint64", indexed: false },
            { name: "totalPaid", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "LeaseExtended",
        inputs: [
            { name: "listingId", type: "bytes32", indexed: true },
            { name: "renter", type: "address", indexed: true },
            { name: "newExpires", type: "uint64", indexed: false },
            { name: "totalPaid", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "ListingCanceled",
        inputs: [
            { name: "listingId", type: "bytes32", indexed: true },
        ],
    },
    {
        type: "event",
        name: "WithdrawalClaimed",
        inputs: [
            { name: "owner", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
    // View functions for read contract calls from handlers
    {
        type: "function",
        name: "listings",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [
            { name: "nfa", type: "address" },
            { name: "tokenId", type: "uint256" },
            { name: "owner", type: "address" },
            { name: "pricePerDay", type: "uint96" },
            { name: "minDays", type: "uint32" },
            { name: "active", type: "bool" },
        ],
        stateMutability: "view",
    },
] as const;
