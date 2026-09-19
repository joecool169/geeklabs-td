# App Store preparation — 2026-09-17

This records live App Store Connect changes, not a public release. Version 1.0
remains **Prepare for Submission**. No public App Review submission was sent.

## Owner decisions

- Free app.
- All eligible countries and regions.
- `support@geeklabs.io` is actively monitored (confirmed this session).

## Saved in App Store Connect

- Build **1.0 (2)** attached to the App Store version. External TestFlight status
  is **Testing**; three Friends & Family testers were invited this session.
- Description, promotional text, keywords, support and marketing URLs,
  copyright, and App Review notes saved.
- Subtitle: **Endless tactical tower defense**.
- Category: **Games / Strategy**; optional second category omitted.
- Review contact: Joseph George, using the previously authorized phone/email.
  Contact inputs were visually verified before saving; accessibility text does
  not expose their values reliably.
- Sign-in required unchecked; review notes explain landscape controls,
  offline play, generated callsigns, and optional online score submission.
- Manual release selected, so approval does not automatically publish the app.
- Free pricing saved with United States as the base region; all 175 regions
  selected for availability after release, subject to regional eligibility.
- Apple Silicon Mac and Apple Vision Pro availability disabled for initial
  release because this preparation verifies iPhone and iPad only.
- Age-rating questionnaire saved: frequent fantasy violence, weapons, and
  contests (the current definition includes competition for rankings);
  no realistic violence, gambling, loot boxes, mature/sexual/medical content,
  advertising, messaging, unrestricted web browsing, or free-form UGC.
  Apple calculated 13+ for current OS versions (12+ on pre-26 systems), with
  regional variations. Apple also warned about Afghanistan/Morocco availability
  and possible regional licensing requirements.
- Privacy-policy URL saved. Gameplay Content draft saved as App Functionality,
  not linked to identity, and not used for tracking. **Not published**: the
  final label still needs confirmation of service-provider logging/retention.

## Verification

- Apple's **Add for Review** validation reports only these missing requirements:
  screenshots for 13-inch iPad and 6.5-inch iPhone displays, Content Rights
  Information, and finalized App Privacy information.
- Public support and privacy URLs returned HTTP 200. The privacy page was
  inspected in the browser and describes the current optional leaderboard,
  generated callsigns, local storage, Cloudflare service data, and support.
- Release Simulator build succeeded without gameplay source changes. All 45
  non-hidden packaged public files match the uploaded build-2 archive exactly.
- Simulator app installed/launched on iPhone 17 Pro Max simulator successfully.
- Screenshot capture remains incomplete: Computer Use could operate Xcode but
  Device Hub access timed out. Existing August screenshots are outdated and
  were deliberately not uploaded.

## Remaining preparation

1. Capture and visually inspect native build-2 iPhone/iPad screenshots, upload
   into Apple's accepted size slots, and verify processing/order.
2. Finalize content-rights declaration using the asset/sound provenance and
   third-party notices. The form remains unset.
3. Confirm Cloudflare account-level logging/retention and finish/publish the
   accurate privacy label. The existing Gameplay Content answer is a draft,
   not a completed inventory of all third-party data processing.
4. Check regional eligibility before release: DSA account setup is incomplete;
   China mainland ICP and Vietnam game-license fields are unset. Do not claim
   worldwide eligibility solely because all regions were selected.
5. Confirm final TestFlight device acceptance and existing production-service
   release gates from READINESS.md, then rerun Apple's submission validation.

## Saved store description

Defense Protocol is a tactical tower defense game about readable threats,
deliberate upgrades, and surviving one more wave.

Build a mixed defensive line from four distinct tower systems. Set targeting
priorities, invest in upgrades, and adapt as fast, heavy, and armored enemies
pressure the route to your core.

Features:

- Four tower systems with distinct battlefield roles
- Three difficulty modes
- Endless waves that reward flexible defenses
- Targeting controls and meaningful upgrade choices
- Touch controls for iPhone and iPad
- Global leaderboards with optional score sharing
- Offline gameplay and local scores
- No account required

Build the line. Hold the core.

## September 18 screenshot update

Joe supplied three current iPhone screenshots, each 2868 × 1320. Unmodified
originals are preserved under `screenshots/2026-09-18-iphone/` in intended
listing order: wave 32, wave 2, start screen. All three were uploaded and
accepted in the 6.9-inch slot after sign-in was restored. The saved sequence
was verified, and the 6.5-inch slot automatically uses the 6.9-inch images.
Current iPad screenshots remain needed. No review submission was sent.

## iPad screenshots completed — September 18

Four current 2732 × 2048 iPad screenshots supplied by Joe were accepted in
the 13-inch slot. Originals are preserved in `screenshots/2026-09-18-ipad/`.
Order: wave 32, wave 7, pause menu, tower placement. This supersedes the earlier
missing-iPad screenshot note. Privacy policy/manifest reconciliation and final
privacy publication remain outstanding; no review submission was sent.

## September 18 completed preparation — build 3

This update supersedes earlier outstanding privacy/build notes above.

- Published App Privacy responses were visibly confirmed in App Store Connect:
  User ID, Gameplay Content, Coarse Location, Other Diagnostic Data; all linked,
  none used for tracking. Joe explicitly approved publishing the agreement.
- Public privacy policy updated and verified HTTP 200 at
  https://geeklabs.io/privacy/defense-protocol. Production website commit
  `89b3b6a772cb670be6be700d6c1892498a9450e3`; local equivalent `a001851`.
- Native manifest reconciled with those disclosures. Version 1.0 build 3 signed,
  archived, successfully uploaded, processed by Apple, and saved as the selected
  App Store build. Build ID: `a31eaeb8-3dcf-4e55-803f-6e8864804e48`.
- Game/source preparation commit `87e4715` pushed to Forgejo and GitHub.
  Game tests, production build, manifest lint, strict signature verification,
  and website tests passed. All 45 packaged public/gameplay files match build 2.
- Add for Review validation passed. Draft Submission shows “Item Ready to
  Submit”, iOS App 1.0, build 1.0 (3). Final Submit for Review was NOT clicked.
  Manual release remains selected.
- Free Apps Agreement active. DSA setup initially failed at Apple, but retry
  opened trader/non-trader form successfully. Awaiting Joe's declaration;
  no trader choice or public contact details submitted. Regional licensing
  eligibility (including China/Vietnam) and final device acceptance still need
  resolution before claiming all-region launch readiness.

DSA follow-up: Joe explicitly selected “Non-trader — personal, non-business
distribution.” Saved that selection. Apple now shows Digital Services Act
Compliance completed and Active for 27 countries/regions. This supersedes the
pending-declaration note above; no public trader contact information was added.
