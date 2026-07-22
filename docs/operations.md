# Rep playbook, CRM, and troubleshooting

## Daily rep workflow

Open Outreach Queue, review the listing, score explanation, seller history, and suggested message. Edit if needed, copy it, open the original Facebook listing, and send manually. Return to mark sent, skipped, or snoozed and add notes. Record replies using the defined result taxonomy. Suppress immediately after a negative response, complaint, block, or do-not-contact request. Create a lead only when genuine contact details or estimate intent exist.

The system never creates a second active listing task, contacts a seller inside 30 days without an admin override, exceeds configured attempts, follows up after a reply/negative response/suppression, or follows up when a listing is inactive. The maximum is one follow-up after seven days.

Rental opportunities are referral opportunities: the landlord, property manager, or property seller may refer the incoming tenant or buyer. Vacant or empty-unit images are positive turnover context and must not be treated as irrelevant because no furniture is present. Furnished rooms may add delivery or furniture-handling demand. Large-item opportunities include furniture, appliances, equipment, and anything likely to need a truck or two-person labour.

## Listings we post

Managers review Saturn Star-owned service drafts under **Listings We Post**. Approved copy is posted manually in Facebook Marketplace, then the rep records the resulting URL. Weekly campaign limits reduce repetitive posting. No browser automation publishes, renews, or edits Facebook listings in this milestone.

## CRM integration

The stub returns a stable external ID for repeated pushes. The webhook client sends the normalized lead with an `Idempotency-Key` header. Production CRM endpoints must persist that key before responding. Failed syncs remain retryable and must surface in System Health.

## Troubleshooting and manual fallback

- Authentication failure: log into Facebook in Chrome, verify the external MCP, and create “Facebook session requires login”.
- GraphQL failure or empty results across known-good searches: pause definitions and create “GraphQL query identifiers must be refreshed”.
- Detail unavailable: retain the summary listing and create “Open listing and verify status”.
- Rate limiting: preserve queued work and allow backoff/jitter; never raise scan volume to catch up in a burst.
- CRM failure: keep the lead locally and retry with the same idempotency key.
- Facebook unavailable: the dashboard, stored tasks, outcome recording, analytics, and CRM-ready records remain available.

## Known limitations and roadmap

The reference Facebook API is unofficial, fragile, macOS/Chrome-dependent, and may violate platform terms. Inbox synchronization, autonomous or browser-assisted sending, account rotation, CAPTCHA bypass, stealth behavior, Kijiji/Craigslist, notifications, experiments, revenue attribution, and map visualization are not part of this milestone. Add future sources through `MarketplaceSource`; stabilize the Windsor worker and production CRM contract before expanding.
