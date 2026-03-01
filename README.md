# SHLL Indexer

Real-time blockchain event indexer and API service for the SHLL Protocol.

## Tech Stack
- [Ponder](https://ponder.sh/)
- TypeScript
- PostgreSQL (or SQLite for local dev)

## Prerequisites
- Node.js 20+
- pnpm 9+

## Quick Start
```bash
pnpm install
pnpm dev
```
The GraphQL endpoint and REST APIs will be available at `http://localhost:42069`.

## Environment Variables
Copy `.env.example` to `.env.local` (or `.env.mainnet`) and configure:

```env
# Network RPCs
PONDER_RPC_BSC_TESTNET=https://data-seed-prebsc-1-s1.bnbchain.org:8545
PONDER_RPC_BSC_MAINNET=https://bsc-dataseed1.binance.org

# Database
DATABASE_URL=postgres://user:password@localhost:5432/shll
```

## Setup Local Postgres (Optional)
If running locally with Postgres, you can use the provided docker-compose:
```bash
docker-compose up -d postgres
```
