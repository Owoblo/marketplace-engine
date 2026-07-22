# Environment and search configuration

All supported variables are documented in `.env.example`. Secrets belong only in the backend environment. On Supabase, `DATABASE_URL` uses the transaction pooler on port 6543 with `pgbouncer=true`; `DIRECT_URL` uses the session pooler on port 5432 for migrations and the durable worker. The default Facebook limit is three requests per minute, maximum radius is 100 km, and coverage buffer is 1.10. `CRM_MODE=stub` keeps exports local; `webhook` requires `CRM_WEBHOOK_URL`.

Windsor seeds nine query families across nine cells. Each family stores rotating terms, priority, and cadence. The planner spreads executions throughout the day and records every run. Administrators can edit searches without changing geographic seeds. Do not multiply every term by every city.

Only Windsor starts with discovery, outreach, follow-ups, and CRM gates enabled. Chatham, Sarnia, London, Woodstock, WKG, and Ottawa are seeded as planned. Brand and campaign choices are deliberately absent from geographic tables.

## Facebook source setup

Run `npm run setup:facebook` to build `/Users/owoblo/Downloads/facebook-marketplace-mcp-master.zip` into the ignored `.runtime` directory without modifying the source archive. Log into Facebook in Chrome on macOS and set `CHROME_PROFILE` to the active profile. The stdio bridge converts the reference MCP's text tool results into validated normalized records. If login expires or GraphQL IDs rotate, pause scans, refresh the external MCP, run its query-capture process manually, and resume after a health check.

Never commit cookies, copied Chrome databases, tokens, query captures containing secrets, or `.env` files.
