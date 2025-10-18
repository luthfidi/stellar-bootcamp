#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, Map, Symbol};

// Storage keys untuk contract data
// Kita pakai symbol_short! untuk efisiensi (max 9 karakter)
const CAMPAIGN_GOAL: Symbol = symbol_short!("goal");
const CAMPAIGN_DEADLINE: Symbol = symbol_short!("deadline");
const TOTAL_RAISED: Symbol = symbol_short!("raised");
const DONATIONS: Symbol = symbol_short!("donations");
const CAMPAIGN_OWNER: Symbol = symbol_short!("owner");
const XLM_TOKEN_ADDRESS: Symbol = symbol_short!("xlm_addr");
const IS_ALREADY_INIT: Symbol = symbol_short!("is_init");

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

    /// Initialize campaign baru dengan goal, deadline, dan XLM token address
    /// Frontend perlu pass: owner address, goal (in stroops), deadline (unix timestamp), xlm_token (address)
    pub fn initialize(
        env: Env,
        owner: Address,    // Address creator campaign
        goal: i128,        // Target amount (stroops: 1 XLM = 10,000,000 stroops)
        deadline: u64,     // Unix timestamp kapan campaign berakhir
        xlm_token: Address, // XLM token contract address (native token di testnet)
    ) {
       // Verify owner adalah yang claim
        owner.require_auth();

        // Store campaign settings ke blockchain
        env.storage().instance().set(&CAMPAIGN_OWNER, &owner);
        env.storage().instance().set(&CAMPAIGN_GOAL, &goal);
        env.storage().instance().set(&CAMPAIGN_DEADLINE, &deadline);
        env.storage().instance().set(&TOTAL_RAISED, &0i128);
        env.storage().instance().set(&XLM_TOKEN_ADDRESS, &xlm_token);

        // Set initialization flag to true
        env.storage().instance().set(&IS_ALREADY_INIT, &true);

        // Initialize empty donations map
        // Map<Address, i128> = tracking siapa donate berapa
        let donations: Map<Address, i128> = Map::new(&env);
        env.storage().instance().set(&DONATIONS, &donations);
    }

    /// Donate ke campaign menggunakan XLM token transfer
    /// Frontend perlu pass: donor address, amount (stroops)
    pub fn donate(env: Env, donor: Address, amount: i128) {
        // Verify donor authorization
        donor.require_auth();

        // Check apakah campaign masih aktif
        let deadline: u64 = env.storage().instance().get(&CAMPAIGN_DEADLINE).unwrap();
        if env.ledger().timestamp() > deadline {
            panic!("Campaign has ended");
        }

        // Validate amount harus positif
        if amount <= 0 {
            panic!("Donation amount must be positive");
        }

        // Get XLM token contract dan contract address
        let xlm_token_address: Address = env.storage().instance().get(&XLM_TOKEN_ADDRESS).unwrap();
        let xlm_token = token::Client::new(&env, &xlm_token_address);
        let contract_address = env.current_contract_address();

        // Transfer XLM dari donor ke contract ini
        xlm_token.transfer(&donor, &contract_address, &amount);

        // Update total raised
        let mut total: i128 = env.storage().instance().get(&TOTAL_RAISED).unwrap();
        total += amount;
        env.storage().instance().set(&TOTAL_RAISED, &total);

        // Track donasi individual donor
        let mut donations: Map<Address, i128> = env.storage().instance().get(&DONATIONS).unwrap();
        let current_donation = donations.get(donor.clone()).unwrap_or(0);
        donations.set(donor, current_donation + amount);
        env.storage().instance().set(&DONATIONS, &donations);
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
    /// Frontend bisa call untuk check siapa owner campaign
    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&CAMPAIGN_OWNER).unwrap()
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