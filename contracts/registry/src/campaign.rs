use crate::types::{CampaignInfo, CampaignRecord, CampaignStatus};
use crate::{events, storage};
use soroban_sdk::{contracttype, Address, Env, IntoVal, String, Symbol, Val, Vec};

pub fn register_campaign(
    env: &Env,
    campaign_id: u64,
    farmer: Address,
    title: String,
    description: String,
) {
    farmer.require_auth();

    if storage::has_campaign(env, campaign_id) {
        panic!("campaign already registered");
    }

    let campaign = CampaignInfo {
        id: campaign_id,
        farmer: farmer.clone(),
        title: title.clone(),
        description,
        created_at: env.ledger().timestamp(),
    };

    storage::set_campaign(env, &campaign);
    storage::extend_instance_ttl(env);

    events::campaign_registered(env, campaign_id, farmer, title);
}

pub fn get_campaign(env: &Env, campaign_id: u64) -> Option<CampaignInfo> {
    storage::get_campaign(env, campaign_id)
}

/// Links a campaign to its ProductionEscrowContract instance and crop/region
/// metadata, and begins tracking its lifecycle status. Distinct from
/// `register_campaign`, which stores the farmer-authored title/description.
pub fn link_campaign_escrow(
    env: &Env,
    campaign_id: u64,
    farmer: &Address,
    escrow_contract: &Address,
    crop_metadata: Symbol,
    region_metadata: Symbol,
) {
    if storage::has_campaign_record(env, campaign_id) {
        panic!("campaign already linked");
    }

    // Approved escrow contracts can link on behalf of the farmer (cross-contract flow);
    // otherwise the farmer must authorize directly.
    if storage::is_contract_approved(env, escrow_contract) {
        escrow_contract.require_auth();
    } else {
        farmer.require_auth();
    }

    let record = CampaignRecord {
        campaign_id,
        farmer: farmer.clone(),
        escrow_contract: escrow_contract.clone(),
        crop_metadata,
        region_metadata,
        status: CampaignStatus::Active,
    };
    storage::set_campaign_record(env, campaign_id, &record);
    storage::add_farmer_campaign(env, farmer, campaign_id);
    storage::extend_instance_ttl(env);

    events::campaign_escrow_linked(env, campaign_id, farmer.clone(), escrow_contract.clone());
}

pub fn update_campaign_status(
    env: &Env,
    campaign_id: u64,
    caller: &Address,
    new_status: CampaignStatus,
) {
    let mut record = storage::get_campaign_record(env, campaign_id);

    let is_admin = storage::get_admin(env) == *caller;
    let is_registered_escrow = record.escrow_contract == *caller;
    if !is_admin && !is_registered_escrow {
        panic!("unauthorized: caller is not the registered escrow contract or admin");
    }
    caller.require_auth();

    let prev_status = record.status.clone();
    record.status = new_status.clone();
    storage::set_campaign_record(env, campaign_id, &record);
    storage::extend_instance_ttl(env);

    events::campaign_status_updated(env, campaign_id, prev_status, new_status);
}

pub fn get_campaign_record(env: &Env, campaign_id: u64) -> CampaignRecord {
    storage::get_campaign_record(env, campaign_id)
}
/// Mirrors `production_escrow::Campaign` field-for-field, so this module can
/// decode `ProductionEscrowContract::get_campaign`'s return value without a
/// compile-time dependency on the `production_escrow` crate -- pulling in its
/// `#[contract]`/`#[contractimpl]` block as a library would statically link
/// its exported wasm symbols into this crate's own binary, colliding with
/// registry's identically-named entrypoints (e.g. `initialize`, `get_admin`,
/// `get_campaign`).
///
/// This must have the *exact same field count and names* as the real
/// `Campaign` struct: on-chain, `Val`-based struct decoding
/// (`Env::map_unpack_to_slice`, used by cross-contract calls) requires the
/// wire map and the local struct to be the same size -- unlike the
/// `ScVal`-based (host/testutils-only) decode path, it does not tolerate a
/// struct with a subset of fields. `CampaignStatus` here is registry's own
/// type (not a distinct escrow-side mirror) -- its variant names are
/// identical to production_escrow's `CampaignStatus`, so it decodes the
/// escrow's status value directly with no separate mapping step required.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
struct EscrowCampaignView {
    pub farmer: Address,
    pub target_amount: i128,
    pub token_address: Address,
    pub deadline: u64,
    pub harvest_metadata: Symbol,
    pub total_funded: i128,
    pub released: i128,
    pub refundable: i128,
    pub returnable: i128,
    pub status: CampaignStatus,
}

/// Permissionless reconciliation: re-derives the campaign's true status by
/// making a cross-contract call into its linked `ProductionEscrowContract`
/// and comparing that against the registry's mirrored `CampaignRecord.status`.
///
/// Nothing on-chain otherwise enforces that the mirror stays in sync --
/// every `update_campaign_status` call today depends on an off-chain
/// orchestrator invoking both contracts in order after each escrow
/// transition. If that orchestrator crashes, is buggy, or is never
/// deployed for a given environment, the mirror can silently and
/// permanently diverge with no on-chain signal. See INTEGRATION.md,
/// "Failure modes".
///
/// No authorization is required: this does not trust any caller-supplied
/// status, only what the escrow contract itself reports for
/// `get_campaign(campaign_id).status`, which is the real source of truth.
/// Being permissionless means anyone -- a monitoring bot, a farmer, an
/// investor -- can self-heal drift as soon as they notice it, instead of
/// waiting on the orchestrator or the admin.
///
/// Returns `true` if drift was found and corrected, `false` if the mirror
/// already matched.
pub fn reconcile_campaign_status(env: &Env, campaign_id: u64) -> bool {
    let mut record = storage::get_campaign_record(env, campaign_id);

    let args: Vec<Val> = Vec::from_array(env, [campaign_id.into_val(env)]);
    let escrow_campaign: EscrowCampaignView = env.invoke_contract(
        &record.escrow_contract,
        &Symbol::new(env, "get_campaign"),
        args,
    );
    let true_status = escrow_campaign.status;

    if record.status == true_status {
        return false;
    }

    let prev_status = record.status.clone();
    record.status = true_status.clone();
    storage::set_campaign_record(env, campaign_id, &record);
    storage::extend_instance_ttl(env);

    events::campaign_status_reconciled(env, campaign_id, prev_status, true_status);
    true
}

pub fn get_campaigns_by_farmer(env: &Env, farmer: &Address) -> Vec<u64> {
    storage::get_farmer_campaigns(env, farmer)
}
