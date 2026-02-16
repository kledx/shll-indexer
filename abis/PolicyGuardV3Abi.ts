export const PolicyGuardV3Abi = [
    // ─── Policy Registry events ───
    {
        type: "event",
        name: "PolicyCreated",
        inputs: [
            { name: "policyId", type: "uint32", indexed: true },
            { name: "version", type: "uint16", indexed: true },
            { name: "policyModules", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "ActionRuleSet",
        inputs: [
            { name: "policyId", type: "uint32", indexed: true },
            { name: "version", type: "uint16", indexed: true },
            { name: "target", type: "address", indexed: true },
            { name: "selector", type: "bytes4", indexed: false },
            { name: "moduleMask", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "PolicyFrozen",
        inputs: [
            { name: "policyId", type: "uint32", indexed: true },
            { name: "version", type: "uint16", indexed: true },
        ],
    },
    // ─── Group Registry events ───
    {
        type: "event",
        name: "GroupMemberSet",
        inputs: [
            { name: "groupId", type: "uint32", indexed: true },
            { name: "member", type: "address", indexed: true },
            { name: "allowed", type: "bool", indexed: false },
        ],
    },
    // ─── Instance Config events ───
    {
        type: "event",
        name: "InstanceConfigBound",
        inputs: [
            { name: "instanceId", type: "uint256", indexed: true },
            { name: "policyId", type: "uint32", indexed: true },
            { name: "version", type: "uint16", indexed: true },
            { name: "paramsHash", type: "bytes32", indexed: false },
        ],
    },
    {
        type: "event",
        name: "ParamsUpdated",
        inputs: [
            { name: "instanceId", type: "uint256", indexed: true },
            { name: "newVersion", type: "uint32", indexed: false },
            { name: "paramsHash", type: "bytes32", indexed: false },
        ],
    },
    // ─── Token Permission events ───
    {
        type: "event",
        name: "PermissionGranted",
        inputs: [
            { name: "instanceId", type: "uint256", indexed: true },
            { name: "permissionBit", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "PermissionRevoked",
        inputs: [
            { name: "instanceId", type: "uint256", indexed: true },
            { name: "permissionBit", type: "uint256", indexed: false },
        ],
    },
    // ─── Execution Mode events ───
    {
        type: "event",
        name: "ExecutionModeChanged",
        inputs: [
            { name: "instanceId", type: "uint256", indexed: true },
            { name: "mode", type: "uint8", indexed: false },
        ],
    },
    // ─── Spend tracking ───
    {
        type: "event",
        name: "Spent",
        inputs: [
            { name: "instanceId", type: "uint256", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
            { name: "dayIndex", type: "uint32", indexed: false },
        ],
    },
    // ─── Access Control events ───
    {
        type: "event",
        name: "TargetBlocked",
        inputs: [
            { name: "target", type: "address", indexed: true },
            { name: "blocked", type: "bool", indexed: false },
        ],
    },
    {
        type: "event",
        name: "AllowedCallerUpdated",
        inputs: [
            { name: "newCaller", type: "address", indexed: true },
        ],
    },
    {
        type: "event",
        name: "MinterUpdated",
        inputs: [
            { name: "newMinter", type: "address", indexed: true },
        ],
    },
    // ─── View for reading instance params ───
    {
        type: "function",
        name: "getInstanceParams",
        stateMutability: "view",
        inputs: [{ name: "instanceId", type: "uint256" }],
        outputs: [
            {
                name: "ref",
                type: "tuple",
                components: [
                    { name: "policyId", type: "uint32" },
                    { name: "version", type: "uint16" },
                ],
            },
            { name: "params", type: "bytes" },
        ],
    },
    // ─── View for schema ───
    {
        type: "function",
        name: "getSchema",
        stateMutability: "view",
        inputs: [
            { name: "policyId", type: "uint32" },
            { name: "version", type: "uint16" },
        ],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "maxSlippageBps", type: "uint16" },
                    { name: "maxTradeLimit", type: "uint96" },
                    { name: "maxDailyLimit", type: "uint96" },
                    { name: "allowedTokenGroups", type: "uint32[]" },
                    { name: "allowedDexGroups", type: "uint32[]" },
                    { name: "receiverMustBeVault", type: "bool" },
                    { name: "forbidInfiniteApprove", type: "bool" },
                    { name: "allowExplorerMode", type: "bool" },
                    { name: "explorerMaxTradeLimit", type: "uint96" },
                    { name: "explorerMaxDailyLimit", type: "uint96" },
                    { name: "allowParamsUpdate", type: "bool" },
                ],
            },
        ],
    },
] as const;
