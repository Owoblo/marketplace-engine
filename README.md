# Saturn Star Marketplace Intelligence Engine

Independent lead-intelligence service for discovering Marketplace demand, classifying and scoring it, and preparing a human-operated outreach queue. Version 0.1 never sends Facebook messages automatically.

## Windsor milestone

The current vertical slice includes exact seven-region geography (Windsor outreach enabled first), 171 canonical cities, 55 deterministic cells, a Facebook source-adapter boundary, normalization and deduplication primitives, validated classification, deterministic scoring, outreach/cooldown/follow-up policy, CRM idempotency, Prisma schema/seeds, and a Next.js operations dashboard.

## Local setup

1. Install Node.js 20+ and PostgreSQL 15+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`. For Supabase, use transaction pooling on port 6543 for `DATABASE_URL` and session pooling on port 5432 for `DIRECT_URL`. Set `SATURN_STAR_PHONE` and dashboard credentials locally.
4. Run `npm run setup:facebook` to build the supplied read-only MCP archive into the ignored runtime directory.
5. Run `npm run db:generate`, `npm run db:deploy`, and `npm run db:seed`.
6. Start the dashboard with `npm run dev` and the worker with `npm run worker` in another terminal.
7. Open `http://localhost:3000`.

Verification: `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.

## Cloudflare production dashboard

The Next.js dashboard deploys to Cloudflare Workers through OpenNext. Supabase access uses a Cloudflare Hyperdrive binding; do not point a Worker directly at the Supabase transaction pooler. Configure `DATABASE_URL`, `DASHBOARD_USERNAME`, and `DASHBOARD_PASSWORD` with `wrangler secret put`, then run `npm run cf:deploy -w @marketplace-engine/dashboard`.

The Facebook discovery worker is intentionally not deployed to Cloudflare. It runs on the authorized Mac because the read-only adapter depends on that machine's logged-in Chrome session. Both processes share the same Supabase database, so the hosted dashboard remains available while the Mac worker is offline.

The supplied `facebook-marketplace-mcp-master.zip` remains external and read-only. Build and configure that project separately; do not place Chrome cookies or Facebook tokens in this repository.

## Packages

- `apps/dashboard`: internal overview, queue, and geographic administration UI.
- `apps/worker`: backend-only job process boundary.
- `packages/geography`: canonical bounds, breakpoints, cities, aliases, Haversine geometry, and Facebook conversion.
- `packages/marketplace-source`: generic source contract and Facebook MCP adapter.
- `packages/intelligence`: validated classification, scoring, and transparent message drafting.
- `packages/operations`: deduplication, cooldown, suppression, launch, and follow-up policy.
- `packages/crm-client`: idempotent stub/webhook CRM clients.
- `packages/database`: Prisma models, migration, and seeds.
- `packages/shared`: Zod contracts, environment validation, and content hashing.

See [Architecture](docs/architecture.md), [Operations](docs/operations.md), and [Configuration](docs/configuration.md).
