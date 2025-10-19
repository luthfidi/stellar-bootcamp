#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, vec, Address, Bytes, BytesN, Env, IntoVal, String, Symbol, Vec, symbol_short};

// Storage keys
const CAMPAIGN_COUNTER: Symbol = symbol_short!("counter");
const CAMPAIGNS: Symbol = symbol_short!("campaigns");

// Campaign info stored in factory for efficient listing
#[contracttype]
#[derive(Clone)]
pub struct CampaignInfo {
    pub id: u64,
    pub address: Address,
    pub title: String,
    pub category: Symbol,
    pub owner: Address,
    pub created_at: u64,
}

#[contract]
pub struct FactoryContract;

#[contractimpl]
impl FactoryContract {

    /// Create a new campaign contract
    /// Returns campaign ID
    pub fn create_campaign(
        env: Env,
        owner: Address,
        title: String,
        description: String,
        goal: i128,
        deadline: u64,
        category: Symbol,
        xlm_token: Address,
        campaign_wasm_hash: BytesN<32>, // WASM hash of campaign contract
    ) -> u64 {
        // Require owner authorization
        owner.require_auth();

        // Validate inputs
        if goal < 100_000_000 {
            panic!("Goal must be at least 10 XLM");
        }

        if deadline <= env.ledger().timestamp() {
            panic!("Deadline must be in the future");
        }

        // Get or initialize counter
        let mut counter: u64 = env.storage().instance().get(&CAMPAIGN_COUNTER).unwrap_or(0);

        // Deploy new campaign contract with salt
        let salt = env.crypto().sha256(&Bytes::from_array(&env, &counter.to_be_bytes()));
        let campaign_address = env
            .deployer()
            .with_current_contract(salt)
            .deploy_v2(campaign_wasm_hash, ());

        // Initialize the campaign contract
        let init_args = vec![
            &env,
            owner.clone().into_val(&env),
            title.clone().into_val(&env),
            description.clone().into_val(&env),
            goal.into_val(&env),
            deadline.into_val(&env),
            category.clone().into_val(&env),
            xlm_token.clone().into_val(&env),
        ];

        env.invoke_contract::<()>(
            &campaign_address,
            &Symbol::new(&env, "initialize"),
            init_args,
        );

        // Store campaign info
        let campaign_info = CampaignInfo {
            id: counter,
            address: campaign_address.clone(),
            title: title.clone(),
            category: category.clone(),
            owner: owner.clone(),
            created_at: env.ledger().timestamp(),
        };

        // Get campaigns vec or create new
        let mut campaigns: Vec<CampaignInfo> = env
            .storage()
            .instance()
            .get(&CAMPAIGNS)
            .unwrap_or(Vec::new(&env));

        campaigns.push_back(campaign_info);
        env.storage().instance().set(&CAMPAIGNS, &campaigns);

        // Increment counter
        counter += 1;
        env.storage().instance().set(&CAMPAIGN_COUNTER, &counter);

        counter - 1 // Return campaign ID
    }

    /// Get campaign address by ID
    pub fn get_campaign(env: Env, id: u64) -> Address {
        let campaigns: Vec<CampaignInfo> = env
            .storage()
            .instance()
            .get(&CAMPAIGNS)
            .unwrap();

        campaigns.get(id as u32).unwrap().address
    }

    /// Get all campaigns with metadata
    pub fn get_all_campaigns(env: Env) -> Vec<CampaignInfo> {
        env.storage()
            .instance()
            .get(&CAMPAIGNS)
            .unwrap_or(Vec::new(&env))
    }

    /// Get campaigns by owner
    pub fn get_campaigns_by_owner(env: Env, owner: Address) -> Vec<u64> {
        let campaigns: Vec<CampaignInfo> = env
            .storage()
            .instance()
            .get(&CAMPAIGNS)
            .unwrap_or(Vec::new(&env));

        let mut owner_campaigns = Vec::new(&env);

        for i in 0..campaigns.len() {
            let campaign = campaigns.get(i).unwrap();
            if campaign.owner == owner {
                owner_campaigns.push_back(campaign.id);
            }
        }

        owner_campaigns
    }

    /// Get total campaign count
    pub fn get_campaign_count(env: Env) -> u64 {
        env.storage().instance().get(&CAMPAIGN_COUNTER).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
