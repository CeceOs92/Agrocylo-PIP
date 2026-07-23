use crate::types::{CampaignInfo, CampaignRecord, DataKey, FarmerProfile};
use soroban_sdk::{Address, Env, Vec};

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_LIFETIME_THRESHOLD: u32 = DAY_IN_LEDGERS * 30;
const INSTANCE_BUMP_AMOUNT: u32 = DAY_IN_LEDGERS * 90;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = DAY_IN_LEDGERS * 30;
const PERSISTENT_BUMP_AMOUNT: u32 = DAY_IN_LEDGERS * 90;

pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn is_contract_approved(env: &Env, contract: &Address) -> bool {
    let key = DataKey::ApprovedContract(contract.clone());
    env.storage().instance().has(&key)
}

pub fn set_contract_approved(env: &Env, contract: &Address, approved: bool) {
    let key = DataKey::ApprovedContract(contract.clone());
    if approved {
        env.storage().instance().set(&key, &true);
    } else {
        env.storage().instance().remove(&key);
    }
}

pub fn has_farmer(env: &Env, farmer: &Address) -> bool {
    let key = DataKey::Farmer(farmer.clone());
    env.storage().persistent().has(&key)
}

pub fn get_farmer(env: &Env, farmer: &Address) -> Option<FarmerProfile> {
    let key = DataKey::Farmer(farmer.clone());
    env.storage().persistent().get(&key)
}

pub fn set_farmer(env: &Env, profile: &FarmerProfile) {
    let key = DataKey::Farmer(profile.address.clone());
    env.storage().persistent().set(&key, profile);
    extend_persistent_ttl(env, &key);
}

pub fn has_campaign(env: &Env, campaign_id: u64) -> bool {
    let key = DataKey::Campaign(campaign_id);
    env.storage().persistent().has(&key)
}

pub fn get_campaign(env: &Env, campaign_id: u64) -> Option<CampaignInfo> {
    let key = DataKey::Campaign(campaign_id);
    env.storage().persistent().get(&key)
}

pub fn set_campaign(env: &Env, campaign: &CampaignInfo) {
    let key = DataKey::Campaign(campaign.id);
    env.storage().persistent().set(&key, campaign);
    extend_persistent_ttl(env, &key);
}

pub fn has_campaign_record(env: &Env, campaign_id: u64) -> bool {
    let key = DataKey::CampaignRecord(campaign_id);
    env.storage().persistent().has(&key)
}

pub fn get_campaign_record(env: &Env, campaign_id: u64) -> CampaignRecord {
    let key = DataKey::CampaignRecord(campaign_id);
    let record = env
        .storage()
        .persistent()
        .get(&key)
        .expect("campaign not found");
    extend_persistent_ttl(env, &key);
    record
}

pub fn set_campaign_record(env: &Env, campaign_id: u64, record: &CampaignRecord) {
    let key = DataKey::CampaignRecord(campaign_id);
    env.storage().persistent().set(&key, record);
    extend_persistent_ttl(env, &key);
}

pub fn get_farmer_campaigns(env: &Env, farmer: &Address) -> Vec<u64> {
    let key = DataKey::FarmerCampaigns(farmer.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}

pub fn add_farmer_campaign(env: &Env, farmer: &Address, campaign_id: u64) {
    let key = DataKey::FarmerCampaigns(farmer.clone());
    let mut campaigns = get_farmer_campaigns(env, farmer);
    campaigns.push_back(campaign_id);
    env.storage().persistent().set(&key, &campaigns);
    extend_persistent_ttl(env, &key);
}
