# Privacy and content-rights audit — September 18, 2026

Status: evidence collected; final App Store label remains unpublished.

## Verified application and live service

- Callsigns are randomly generated from fixed vocabulary, saved locally, and reused across runs until changed. They are pseudonymous player handles, not guaranteed anonymous data. Proposed disclosure: User ID and Gameplay Content, App Functionality, linked through the persistent callsign, not tracking. This corrects the earlier draft assumption that all gameplay content is unlinked. Final inventory also depends on provider settings below.
- The optional POST contains name, difficulty, score, wave, kills. The server adds submission time and an internal score-row ID. There is no account or email field in the score database schema.
- Live leaderboard source was read on geeklabs-td; its SHA-256 matches the running container file: ac7cdc93c613be6a3f23a5b3abc45f7d1946c453e12f290b39ddac7f79253797.
- Live database retention logic keeps the highest 100 entries per difficulty, deleting displaced entries after each submission. This does not immediately remove historical copies in backups.
- Live backup script uses retention_days=30 and daily snapshots; find -mtime +30 cleanup means this is approximately 31 days rather than a strict 30-day maximum. Public policy should describe backup retention separately from live leaderboard deletion.
- Running gateway configuration has access_log off, warning/error logging enabled, and in-memory IP-based score rate limiting. Operational diagnostics remain possible.
- Leaderboard request logs include timestamp, request line and response status. Its log_message implementation does not add client IP or request body. This is operational request logging, not proof that no infrastructure collects IPs.
- Docker log settings for leaderboard, gateway and Cloudflare tunnel are json-file, max-size 10m, max-file 3. Rotation is size-based, not time-based; no fixed age limit was verified.

## Remaining provider verification

Cloudflare dashboard required sign-in. Need inspect applicable analytics/security event retention, log exports, and any enabled request-data processing for play.geeklabs.io before finalizing additional data categories and linkage. Do not infer that Cloudflare has no data merely because application access logging is off.

## Content-rights evidence

Generated artwork provenance and exact synthetic sound reconstruction are documented. MIT runtime notices and a locally bundled GitHub trademark are documented. Owner confirmation of commercial rights to the original Defense Protocol branding was requested; final declaration remains unset pending that fact and applicable third-party-use review.

## Apple reference

https://developer.apple.com/app-store/app-privacy-details/

Apple includes screen names/handles in User ID, requires disclosure of ongoing opt-in collection, and defines tracking separately from pseudonymous data linkage. IP disclosure depends on how it is retained and used.

## Changes not made

No production configuration, public privacy policy, native privacy manifest, or published App Store privacy label was changed during this audit. The build-2 manifest still reflects the prior unlinked Gameplay Content declaration; reconcile it with the final inventory before submission, evaluating whether a new build is required.

## Cloudflare and branding follow-up

Signed-in inspection confirmed geeklabs.io is on the Free plan. Logpush shows
an upgrade/availability page, not configured zone export jobs. Security
Analytics contains retained sampled iOS requests to play.geeklabs.io/api/score
with source IP and request time. Domain analytics also exposes device/browser,
OS and country statistics. No raw visitor identifiers were copied into this record.
Cloudflare documents Free-plan Security Analytics history up to 7 days and
Security Events history up to 24 hours. Those are dashboard dataset limits, not
a claim that every Cloudflare processing purpose has the same retention.

References:
- https://developers.cloudflare.com/waf/analytics/security-analytics/
- https://developers.cloudflare.com/waf/analytics/security-events/

Joe confirmed the logo designer was GeekLabs.io employee Brooklyn Davis,
working on company time on work Joe assigned. Credit added to asset provenance.

## App Store Connect updates

Content Rights was set to Yes, this app has the necessary rights to its
third-party content (licensed runtime components and permitted GitHub project-link
logo use), then Save was clicked. The declaration was visibly reflected in the
form. Original logo attribution is recorded separately for Brooklyn Davis.

Privacy inventory draft expanded to User ID, Gameplay Content, Coarse Location,
and Other Diagnostic Data. User ID setup saved as App Functionality, linked,
not tracking. Coarse Location setup selected Analytics and App Functionality,
linked through retained network data, not tracking; saving was still processing
at the last observation and must be verified. Diagnostic setup and changing
Gameplay Content linkage remain to finish. Publish was not clicked.

Planned policy correction: explain persistent public callsigns as pseudonymous
handles, distinguish live leaderboard deletion from backup copies retained for
approximately 31 days, explicitly describe retained IP/request/device/country
security analytics, and explain size-based operational log rotation without
promising a fixed log age. Reconcile native PrivacyInfo.xcprivacy with the final
collected-data inventory before preparing a replacement build.

Follow-up: Coarse Location and Other Diagnostic Data setups subsequently saved
and were visibly verified. Gameplay Content linkage was changed to linked
through callsign, with App Functionality and no tracking retained; Save clicked.
The four-category draft is not published. Public policy and native manifest
reconciliation remain required preparation tasks.
