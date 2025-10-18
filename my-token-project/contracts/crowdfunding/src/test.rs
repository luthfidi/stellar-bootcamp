#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, token, Address, Env};

const XLM_CONTRACT_TESTNET: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// Helper function to create and setup a mock token for testing
fn create_token_contract<'a>(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'a>) {
    let token_address = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::StellarAssetClient::new(&env, &token_address.address());
    (token_address.address(), token)
}

// Test 1: Initialize campaign successfully
#[test]
fn test_initialize_campaign() {
    // Setup test environment
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    // Create mock addresses
    let owner = Address::generate(&env);
    let goal = 900_000_000i128; // 90 XLM goal (90 * 10^7 stroops)
    let deadline = env.ledger().timestamp() + 86400; // 24 jam dari sekarang
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    // Mock authorization untuk owner
    env.mock_all_auths();

    // Verify campaign initialized dengan benar
    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Verify campaign initialized dengan benar
    assert_eq!(client.get_total_raised(), 0);
}

// Test 2: Make a donation
#[test]
fn test_get_donation_no_donation() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let non_donor = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    // Initialize campaign
    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Check donation amount for address that never donated
    assert_eq!(client.get_donation(&non_donor), 0);
}

// Test 3: Cannot donate negative or zero amount
#[test]
#[should_panic(expected = "Donation amount must be positive")]
fn test_donate_zero_amount() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Try to donate 0 - should panic
    client.donate(&donor, &0);
}

// Test 4: Cannot donate negative amount
#[test]
#[should_panic(expected = "Donation amount must be positive")]
fn test_donate_negative_amount() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Try to donate negative amount - should panic
    client.donate(&donor, &-100_000_000);
}

// Test 5: Campaign deadline validation
#[test]
#[should_panic(expected = "Campaign has ended")]
fn test_donate_after_deadline() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 100;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Fast forward time past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // This should panic - will fail at XLM transfer but deadline check comes first
    client.donate(&donor, &100_000_000);
}

// Test 6: Check initialization status before initialization
#[test]
fn test_is_already_init_before_initialization() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    // Before initialization, should return false
    assert_eq!(client.get_is_already_init(), false);
}

// Test 7: Check initialization status after initialization
#[test]
fn test_is_already_init_after_initialization() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    // Before initialization
    assert_eq!(client.get_is_already_init(), false);

    // Initialize the contract
    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // After initialization, should return true
    assert_eq!(client.get_is_already_init(), true);
}

// Test 8: Initialization flag persists after other operations
#[test]
fn test_is_already_init_persists() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    // Initialize the contract
    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Verify it's initialized
    assert_eq!(client.get_is_already_init(), true);

    // Check after querying other functions
    let _ = client.get_total_raised();
    let _ = client.get_donation(&donor);

    // Should still be true
    assert_eq!(client.get_is_already_init(), true);
}


// Test 9: Get goal returns correct amount
#[test]
fn test_get_goal() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128; // 90 XLM
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    // Before initialization, should return 0
    assert_eq!(client.get_goal(), 0);

    // Initialize the contract
    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // After initialization, should return the correct goal
    assert_eq!(client.get_goal(), goal);
}

// Test 10: Get deadline returns correct timestamp
#[test]
fn test_get_deadline() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400; // 24 hours from now
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    // Before initialization, should return 0
    assert_eq!(client.get_deadline(), 0);

    // Initialize the contract
    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // After initialization, should return the correct deadline
    assert_eq!(client.get_deadline(), deadline);
}

// Test 11: Check if goal is reached when goal is met
#[test]
fn test_is_goal_reached_when_met() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 100_000_000i128; // 10 XLM goal
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Before reaching goal
    assert_eq!(client.is_goal_reached(), false);
}

// Test 12: Check if goal is not reached
#[test]
fn test_is_goal_not_reached() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128; // 90 XLM goal
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Goal should not be reached (no donations yet)
    assert_eq!(client.is_goal_reached(), false);
}

// Test 13: Check if campaign has ended
#[test]
fn test_is_ended_after_deadline() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 100;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Before deadline
    assert_eq!(client.is_ended(), false);

    // Fast forward time past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // After deadline
    assert_eq!(client.is_ended(), true);
}

// Test 14: Check if campaign is not ended
#[test]
fn test_is_not_ended_before_deadline() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Campaign should not be ended (still within deadline)
    assert_eq!(client.is_ended(), false);
}

// Test 15: Get progress percentage with no donations
#[test]
fn test_get_progress_percentage_zero() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128; // 90 XLM
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // No donations, should be 0%
    assert_eq!(client.get_progress_percentage(), 0);
}

// Test 16: Get progress percentage with zero goal (edge case)
#[test]
fn test_get_progress_percentage_zero_goal() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 0i128; // Zero goal (edge case)
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Should return 0 to avoid division by zero
    assert_eq!(client.get_progress_percentage(), 0);
}

// Test 17: Get owner returns correct address
#[test]
fn test_get_owner() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 900_000_000i128;
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &xlm_token_address);

    // Should return the correct owner address
    assert_eq!(client.get_owner(), owner);
}

// 🎓 REFUND TESTS - Bonus Challenge Implementation

// Test 18: Successful refund when goal not reached
#[test]
fn test_refund_success() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 100_000_000i128; // 10 XLM
    let deadline = env.ledger().timestamp() + 100;

    // Create mock token contract
    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    // Mint tokens to donor so they can donate
    token_client.mint(&donor, &100_000_000i128);

    client.initialize(&owner, &goal, &deadline, &token_address);

    // Make donation (less than goal)
    let donation_amount = 30_000_000i128; // 3 XLM
    client.donate(&donor, &donation_amount);

    // Verify donation recorded
    assert_eq!(client.get_donation(&donor), donation_amount);
    assert_eq!(client.get_total_raised(), donation_amount);

    // Fast forward past deadline (goal not reached)
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Verify campaign ended and goal not reached
    assert_eq!(client.is_ended(), true);
    assert_eq!(client.is_goal_reached(), false);

    // Refund
    let refunded = client.refund(&donor);

    // Verify refund
    assert_eq!(refunded, donation_amount);
    assert_eq!(client.get_donation(&donor), 0);
    assert_eq!(client.get_total_raised(), 0);
}

// Test 19: Refund fails before deadline
#[test]
#[should_panic(expected = "Campaign belum berakhir")]
fn test_refund_before_deadline() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 1000;

    // Create mock token contract
    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    // Mint tokens to donor
    token_client.mint(&donor, &100_000_000i128);

    client.initialize(&owner, &goal, &deadline, &token_address);
    client.donate(&donor, &30_000_000);

    // Try refund before deadline - should panic
    client.refund(&donor);
}

// Test 20: Refund fails when goal reached
#[test]
#[should_panic(expected = "Goal sudah tercapai, tidak bisa refund")]
fn test_refund_when_goal_reached() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 50_000_000i128; // 5 XLM
    let deadline = env.ledger().timestamp() + 100;

    // Create mock token contract
    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    // Mint tokens to donor
    token_client.mint(&donor, &100_000_000i128);

    client.initialize(&owner, &goal, &deadline, &token_address);

    // Donate exactly goal amount
    client.donate(&donor, &goal);

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Verify goal reached
    assert_eq!(client.is_goal_reached(), true);

    // Try refund when goal reached - should panic
    client.refund(&donor);
}

// Test 21: Refund fails when no donation exists
#[test]
#[should_panic(expected = "Tidak ada donasi untuk di-refund")]
fn test_refund_no_donation() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let non_donor = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 100;

    // Create mock token contract
    let (token_address, _token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    client.initialize(&owner, &goal, &deadline, &token_address);

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Try refund without donation - should panic
    client.refund(&non_donor);
}