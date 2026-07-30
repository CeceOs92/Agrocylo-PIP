# Integration Tests — Campaign Lifecycle

End-to-end tests that exercise `ProductionEscrowContract` and `RegistryContract`
**together**, in a single Soroban test environment, the way a real deployment
would: an off-chain indexer calls escrow lifecycle methods and mirrors each
transition into the registry's activity log via `record_activity`.

This crate has no contract of its own — it's a pure test harness. The unit
tests inside `production_escrow/src/test.rs` and `registry/src/test.rs`
still cover each contract in isolation; this crate is additive and focuses
purely on cross-contract consistency.

## What's covered

`tests/campaign_lifecycle.rs` covers the full lifecycle described in the
top-level README (`FUNDING → FUNDED → IN_PRODUCTION → HARVESTED → SETTLED`,
plus the `FAILED` and `DISPUTED` branches):

| Test | Flow |
|---|---|
| `happy_path_full_lifecycle_settlement` | Funding → Funded → Harvested → Settled, plus investor return claims |
| `failed_campaign_refund_flow` | Partial funding → marked Failed → investor refund |
| `disputed_campaign_partial_settlement_flow` | Funded → Disputed → Resolved (partial settlement) → investor refunds |
| `registry_activity_log_tracks_every_escrow_transition` | Asserts the registry's activity log entry count matches every escrow state transition, end to end |

Each test asserts:
- Escrow campaign state (`Campaign.status`, `released`, `refundable`,
  `returnable`) after every step.
- Token balances after settlement/refund/return claims (real token
  transfers via a Stellar Asset Contract, not just bookkeeping).
- The registry's `get_campaign_activities` log mirrors the escrow's
  transitions in the right order.
- Both contracts emit their expected events (`CampaignCreated`,
  `CampaignFunded`, `HarvestReported`, `CampaignSettled`, `CampaignFailed`,
  `RefundClaimed`, `DisputeOpened`, `DisputeResolved`, `ActivityRecorded`,
  etc.) via `env.events().all()`.

## Why the registry doesn't auto-sync

`ProductionEscrowContract` does not call `RegistryContract` directly — there
is no cross-contract call wired up in `lib.rs` for either contract. In this
architecture, the registry is fed by a trusted off-chain indexer (or the
escrow contract itself, once cross-contract calls are added) calling
`record_activity`. The test harness (`Harness` in `campaign_lifecycle.rs`)
plays that indexer role: after every escrow call it makes the matching
`registry.record_activity(...)` call, then asserts the two contracts agree.

The registry's `record_activity` requires `actor.require_auth()` for every
activity entry, including entries attributed to the admin or an approved
contract (`approve_contract`). The harness uses mocked authorizations during
setup so activity can be attributed to the escrow contract or its
investors/farmer while still matching the production requirement that the
claimed actor signs the activity entry.
for every step.

## Running the tests

From the `contracts/` directory:

```bash
# Run just the integration suite
cargo test -p integration_tests

# Run everything (unit tests in both contracts + this suite)
cargo test
```

Requires a standard Rust toolchain (stable, 2021 edition) with
`wasm32-unknown-unknown` available if you also want to build the contracts
for deployment — the test suite itself runs as plain native Rust tests and
does not require the wasm target. See `contracts/SETUP.md` for the full
contributor environment setup (this mirrors that, with no additional steps
needed specifically for this crate — it's a normal workspace member).

## Adding a new lifecycle scenario

1. Reuse `Harness::new()` to get a freshly deployed pair of contracts with
   one Active campaign and a funded token already in place.
2. Drive the escrow contract through whatever sequence of calls your
   scenario needs, calling `registry.record_activity(...)` after each step
   that should be indexed (use the existing tests as a reference for which
   `ActivityAction` variant matches which escrow call).
3. Assert on `h.campaign()` (escrow state), `h.token_client().balance(...)`
   (fund movement), and `h.registry.get_campaign_activities(...)` (registry
   state) at the points that matter for your scenario.
4. If your scenario should emit specific events, use the
   `escrow_emitted(&h, "TopicName")` / `registry_emitted(&h, "TopicName")`
   helpers.
