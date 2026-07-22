# Architecture and schema

The attack lane follows `source adapter → normalized listing → image/text classification → deterministic score → territory/launch gate → human task → contact result → idempotent CRM lead`. Facebook authentication is confined to the external MCP process; the Apify token is confined to the worker; neither reaches the dashboard. The defensive lane follows `owned campaign → listing draft → manager approval → manual post → recorded URL`; it never publishes automatically.

Kijiji searches are regional rather than city-by-keyword or canonical-cell-by-keyword. Each region/query family generates one newest-first search. The first run may ingest seven days; later runs use the previous successful run minus a safety overlap. The adapter returns full descriptions, images, coordinates, stable seller IDs, and public contact data where Kijiji exposes it. Public contact data is never treated as consent and never triggers autonomous calling or messaging.

PostgreSQL is the system of record. Prisma models cover discovery, outreach, configurable scoring, geography, audit, CRM, and owned-listing campaigns, including `Source`, `Region`, `GeographicSearchCell`, `SearchDefinition`, `SearchRun`, `SellerProfile`, `Listing`, `Opportunity`, `OutreachTask`, `ContactAttempt`, `Lead`, `SuppressionRecord`, `ScoringConfiguration`, `OwnedListingCampaign`, `OwnedListingDraft`, `AuditEvent`, and role-bearing `User`.

Important idempotency constraints include source plus external listing ID, source/cell/query search uniqueness, one opportunity per listing/territory, task identity per opportunity/type/status, search-run lock keys, one lead per opportunity, and a CRM idempotency key. Listing content hashes determine material changes; cross-cell and cross-search duplicates converge on the same canonical listing.

The scheduler uses pg-boss in PostgreSQL alongside persisted `nextRunAt`, lock keys, and search runs. Retries use exponential backoff with jitter; authentication/document-ID failures pause affected definitions and generate manual source tasks instead of hot-looping.

## Geography

Canonical grids remain rectangular and source-independent. Rows are zero-based south-to-north; columns are west-to-east. Facebook input is calculated only in the adapter-facing converter from cell centre and Haversine corner distance, buffered by 1.10. Radius caps create temporary source search points without altering canonical cells. Future rectangular-bound sources consume cell bounds directly.

## Reference MCP assessment

Reusable: search variable shape, response field mapping, Chrome session boundary, read-only behavior, and conservative rate limiting. Fragile: rotating document IDs, regex parsing, silent empty-result fallbacks, process-local throttling, JSON monitor persistence, macOS-only cookie extraction, and shell command construction. The engine wraps it rather than embedding those details.
