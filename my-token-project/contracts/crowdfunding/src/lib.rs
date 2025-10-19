#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, token, Address, Env, Map, String, Symbol, Vec};

// Storage keys untuk contract data
// Kita pakai symbol_short! untuk efisiensi (max 9 karakter)
const CAMPAIGN_GOAL: Symbol = symbol_short!("goal");
const CAMPAIGN_DEADLINE: Symbol = symbol_short!("deadline");
const TOTAL_RAISED: Symbol = symbol_short!("raised");
const DONATIONS: Symbol = symbol_short!("donations");
const CAMPAIGN_OWNER: Symbol = symbol_short!("owner");
const XLM_TOKEN_ADDRESS: Symbol = symbol_short!("xlm_addr");
const IS_ALREADY_INIT: Symbol = symbol_short!("is_init");

// New storage keys for metadata and features
const CAMPAIGN_TITLE: Symbol = symbol_short!("title");
const CAMPAIGN_DESC: Symbol = symbol_short!("desc");
const CAMPAIGN_CATEGORY: Symbol = symbol_short!("category");
const DONATION_HISTORY: Symbol = symbol_short!("history");
const WITHDRAWN: Symbol = symbol_short!("withdrawn");
const CREATED_AT: Symbol = symbol_short!("created");

// Donation record for history tracking
#[contracttype]
#[derive(Clone)]
pub struct DonationRecord {
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

// Campaign metadata
#[contracttype]
#[derive(Clone)]
pub struct CampaignMetadata {
    pub title: String,
    pub description: String,
    pub category: Symbol,
    pub owner: Address,
    pub goal: i128,
    pub deadline: u64,
    pub created_at: u64,
}

// Contract struct
#[contract]
pub struct CrowdfundingContract;

// Contract implementation
// Note: Kita pakai i128 (signed integer) untuk amounts karena:
// - Ini standard Stellar ecosystem (compatible dengan token contracts)
// - Memungkinkan safe error checking (hitung dulu, validate kemudian)
// - Walaupun donations tidak bisa negatif, i128 membantu catch bugs
#[contractimpl]
impl CrowdfundingContract {

    /// Initialize campaign with metadata
    pub fn initialize(
        env: Env,
        owner: Address,
        title: String,
        description: String,
        goal: i128,
        deadline: u64,
        category: Symbol,
        xlm_token: Address,
    ) {
        // Verify owner authorization
        owner.require_auth();

        // Validate inputs
        if goal < 100_000_000 {
            panic!("Goal must be at least 10 XLM");
        }

        if deadline <= env.ledger().timestamp() {
            panic!("Deadline must be in the future");
        }

        // Store campaign metadata
        env.storage().instance().set(&CAMPAIGN_TITLE, &title);
        env.storage().instance().set(&CAMPAIGN_DESC, &description);
        env.storage().instance().set(&CAMPAIGN_CATEGORY, &category);
        env.storage().instance().set(&CAMPAIGN_OWNER, &owner);
        env.storage().instance().set(&CAMPAIGN_GOAL, &goal);
        env.storage().instance().set(&CAMPAIGN_DEADLINE, &deadline);
        env.storage().instance().set(&CREATED_AT, &env.ledger().timestamp());

        // Initialize campaign state
        env.storage().instance().set(&TOTAL_RAISED, &0i128);
        env.storage().instance().set(&XLM_TOKEN_ADDRESS, &xlm_token);
        env.storage().instance().set(&IS_ALREADY_INIT, &true);
        env.storage().instance().set(&WITHDRAWN, &false);

        // Initialize empty donations map and history
        let donations: Map<Address, i128> = Map::new(&env);
        env.storage().instance().set(&DONATIONS, &donations);

        let history: Vec<DonationRecord> = Vec::new(&env);
        env.storage().instance().set(&DONATION_HISTORY, &history);
    }

    /// Donate to campaign
    pub fn donate(env: Env, donor: Address, amount: i128) {
        // Verify donor authorization
        donor.require_auth();

        // Check if campaign active
        let deadline: u64 = env.storage().instance().get(&CAMPAIGN_DEADLINE).unwrap();
        if env.ledger().timestamp() > deadline {
            panic!("Campaign has ended");
        }

        // Check if already withdrawn
        let withdrawn: bool = env.storage().instance().get(&WITHDRAWN).unwrap_or(false);
        if withdrawn {
            panic!("Campaign funds already withdrawn");
        }

        // Validate amount (min 0.1 XLM = 1,000,000 stroops)
        if amount < 1_000_000 {
            panic!("Minimum donation is 0.1 XLM");
        }

        // Get XLM token contract and contract address
        let xlm_token_address: Address = env.storage().instance().get(&XLM_TOKEN_ADDRESS).unwrap();
        let xlm_token = token::Client::new(&env, &xlm_token_address);
        let contract_address = env.current_contract_address();

        // Transfer XLM from donor to contract
        xlm_token.transfer(&donor, &contract_address, &amount);

        // Update total raised
        let mut total: i128 = env.storage().instance().get(&TOTAL_RAISED).unwrap();
        total += amount;
        env.storage().instance().set(&TOTAL_RAISED, &total);

        // Track individual donor donations
        let mut donations: Map<Address, i128> = env.storage().instance().get(&DONATIONS).unwrap();
        let current_donation = donations.get(donor.clone()).unwrap_or(0);
        donations.set(donor.clone(), current_donation + amount);
        env.storage().instance().set(&DONATIONS, &donations);

        // Add to donation history
        let mut history: Vec<DonationRecord> = env.storage().instance().get(&DONATION_HISTORY).unwrap();
        let record = DonationRecord {
            donor: donor.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        };
        history.push_back(record);
        env.storage().instance().set(&DONATION_HISTORY, &history);
    }

    /// Get total amount yang sudah terkumpul
    /// Frontend bisa call tanpa parameter
    pub fn get_total_raised(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_RAISED).unwrap_or(0)
    }

    /// Get berapa banyak specific donor sudah donate
    /// Frontend perlu pass: donor address
    pub fn get_donation(env: Env, donor: Address) -> i128 {
        let donations: Map<Address, i128> = env.storage().instance().get(&DONATIONS).unwrap();
        donations.get(donor).unwrap_or(0)
    }

    // Get initialization status - for frontend to check if contract is initialized
    pub fn get_is_already_init(env: Env) -> bool {
        env.storage().instance().get(&IS_ALREADY_INIT).unwrap_or(false)
    }

    /// Get campaign goal amount
    /// Frontend bisa call tanpa parameter
    pub fn get_goal(env: Env) -> i128 {
        env.storage().instance().get(&CAMPAIGN_GOAL).unwrap_or(0)
    }

    /// Get campaign deadline timestamp
    /// Frontend bisa call tanpa parameter
    pub fn get_deadline(env: Env) -> u64 {
        env.storage().instance().get(&CAMPAIGN_DEADLINE).unwrap_or(0)
    }

    /// Check apakah campaign goal sudah tercapai
    /// Returns true jika total raised >= goal
    pub fn is_goal_reached(env: Env) -> bool {
        let total_raised: i128 = env.storage().instance().get(&TOTAL_RAISED).unwrap_or(0);
        let goal: i128 = env.storage().instance().get(&CAMPAIGN_GOAL).unwrap_or(0);
        total_raised >= goal
    }

    /// Check apakah campaign sudah berakhir
    /// Returns true jika current time > deadline
    pub fn is_ended(env: Env) -> bool {
        let deadline: u64 = env.storage().instance().get(&CAMPAIGN_DEADLINE).unwrap_or(0);
        env.ledger().timestamp() > deadline
    }

    /// Calculate progress percentage dari campaign
    /// Returns (total_raised * 100) / goal
    /// Returns 0 jika goal adalah 0 (untuk avoid division by zero)
    pub fn get_progress_percentage(env: Env) -> i128 {
        let total_raised: i128 = env.storage().instance().get(&TOTAL_RAISED).unwrap_or(0);
        let goal: i128 = env.storage().instance().get(&CAMPAIGN_GOAL).unwrap_or(0);

        if goal == 0 {
            return 0;
        }

        (total_raised * 100) / goal
    }

    /// Get owner address
    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&CAMPAIGN_OWNER).unwrap()
    }

    /// Get campaign metadata
    pub fn get_metadata(env: Env) -> CampaignMetadata {
        CampaignMetadata {
            title: env.storage().instance().get(&CAMPAIGN_TITLE).unwrap(),
            description: env.storage().instance().get(&CAMPAIGN_DESC).unwrap(),
            category: env.storage().instance().get(&CAMPAIGN_CATEGORY).unwrap(),
            owner: env.storage().instance().get(&CAMPAIGN_OWNER).unwrap(),
            goal: env.storage().instance().get(&CAMPAIGN_GOAL).unwrap(),
            deadline: env.storage().instance().get(&CAMPAIGN_DEADLINE).unwrap(),
            created_at: env.storage().instance().get(&CREATED_AT).unwrap(),
        }
    }

    /// Get donation history (paginated)
    /// Returns last N donations based on limit and offset (newest first)
    pub fn get_donation_history(env: Env, limit: u32, offset: u32) -> Vec<DonationRecord> {
        let history: Vec<DonationRecord> = env
            .storage()
            .instance()
            .get(&DONATION_HISTORY)
            .unwrap_or(Vec::new(&env));

        let total_len = history.len();

        if total_len == 0 || offset >= total_len {
            return Vec::new(&env);
        }

        let mut result = Vec::new(&env);

        // Return in reverse order (newest first)
        // Start from the end and work backwards
        let start_idx = total_len.saturating_sub(1 + offset);
        let end_idx = if start_idx >= limit {
            start_idx - limit + 1
        } else {
            0
        };

        for i in (end_idx..=start_idx).rev() {
            if let Some(record) = history.get(i) {
                result.push_back(record);
            }
        }

        result
    }

    /// Withdraw funds - Owner only, after goal reached + ended
    pub fn withdraw(env: Env, owner: Address) -> i128 {
        // Authorization check
        owner.require_auth();

        // Verify owner
        let campaign_owner: Address = env.storage().instance().get(&CAMPAIGN_OWNER).unwrap();
        if owner != campaign_owner {
            panic!("Only owner can withdraw");
        }

        // Check if campaign ended
        if !Self::is_ended(env.clone()) {
            panic!("Campaign has not ended yet");
        }

        // Check if goal reached
        if !Self::is_goal_reached(env.clone()) {
            panic!("Goal not reached, cannot withdraw");
        }

        // Check if already withdrawn
        let withdrawn: bool = env.storage().instance().get(&WITHDRAWN).unwrap_or(false);
        if withdrawn {
            panic!("Funds already withdrawn");
        }

        // Get total raised amount
        let total_raised: i128 = env.storage().instance().get(&TOTAL_RAISED).unwrap();

        if total_raised <= 0 {
            panic!("No funds to withdraw");
        }

        // Transfer funds to owner
        let xlm_token_address: Address = env.storage().instance().get(&XLM_TOKEN_ADDRESS).unwrap();
        let xlm_token = token::Client::new(&env, &xlm_token_address);
        let contract_address = env.current_contract_address();

        xlm_token.transfer(&contract_address, &owner, &total_raised);

        // Mark as withdrawn
        env.storage().instance().set(&WITHDRAWN, &true);

        total_raised
    }

    /// Refund function - allow donors to get their money back
    /// Only works if campaign ended AND goal NOT reached
    /// Returns the amount refunded to the donor
    pub fn refund(env: Env, donor: Address) -> i128 {
        // Step 1: Authorization - donor must authorize this action
        donor.require_auth();

        // Step 2: Validation - check campaign has ended
        if !Self::is_ended(env.clone()) {
            panic!("Campaign belum berakhir");
        }

        // Step 3: Validation - check goal NOT reached
        if Self::is_goal_reached(env.clone()) {
            panic!("Goal sudah tercapai, tidak bisa refund");
        }

        // Step 4: Get donor's donation amount
        let donations: Map<Address, i128> = env.storage().instance().get(&DONATIONS).unwrap();
        let donation_amount = donations.get(donor.clone()).unwrap_or(0);

        // Step 5: Validate donor has actual donation
        if donation_amount <= 0 {
            panic!("Tidak ada donasi untuk di-refund");
        }

        // Step 6: Transfer XLM back from contract to donor
        let xlm_token_address: Address = env.storage().instance().get(&XLM_TOKEN_ADDRESS).unwrap();
        let xlm_token = token::Client::new(&env, &xlm_token_address);
        let contract_address = env.current_contract_address();

        // Transfer from contract back to donor
        xlm_token.transfer(&contract_address, &donor, &donation_amount);

        // Step 7: Remove donor from donations map
        let mut donations: Map<Address, i128> = env.storage().instance().get(&DONATIONS).unwrap();
        donations.set(donor.clone(), 0);
        env.storage().instance().set(&DONATIONS, &donations);

        // Step 8: Update total_raised (subtract refunded amount)
        let mut total: i128 = env.storage().instance().get(&TOTAL_RAISED).unwrap();
        total -= donation_amount;
        env.storage().instance().set(&TOTAL_RAISED, &total);

        // Step 9: Return refunded amount
        donation_amount
    }
}

#[cfg(test)]
mod test;