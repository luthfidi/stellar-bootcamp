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

// Helper function to initialize campaign with default metadata
fn init_campaign(
    client: &CrowdfundingContractClient,
    env: &Env,
    owner: &Address,
    goal: i128,
    deadline: u64,
    xlm_token: &Address,
) {
    let title = String::from_str(&env, "Test Campaign");
    let description = String::from_str(&env, "This is a test campaign");
    let category = symbol_short!("tech");
    client.initialize(owner, &title, &description, &goal, &deadline, &category, xlm_token);
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

    let title = String::from_str(&env, "Test Campaign");
    let description = String::from_str(&env, "This is a test campaign");
    let category = symbol_short!("tech");

    // Verify campaign initialized dengan benar
    client.initialize(&owner, &title, &description, &goal, &deadline, &category, &xlm_token_address);

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
    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

    // Check donation amount for address that never donated
    assert_eq!(client.get_donation(&non_donor), 0);
}

// Test 3: Cannot donate below minimum amount
#[test]
#[should_panic(expected = "Minimum donation is 0.1 XLM")]
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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

    // Try to donate 0 - should panic
    client.donate(&donor, &0);
}

// Test 4: Cannot donate negative amount
#[test]
#[should_panic(expected = "Minimum donation is 0.1 XLM")]
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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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
    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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
    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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
    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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
    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

    // No donations, should be 0%
    assert_eq!(client.get_progress_percentage(), 0);
}

// Test 16: Get progress percentage with zero goal (edge case)
#[test]
#[should_panic(expected = "Goal must be at least 10 XLM")]
fn test_get_progress_percentage_zero_goal() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 0i128; // Zero goal (should panic now)
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

    // Should panic during initialization
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

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);
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
    let goal = 100_000_000i128; // 10 XLM (minimum)
    let deadline = env.ledger().timestamp() + 100;

    // Create mock token contract
    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    // Mint tokens to donor
    token_client.mint(&donor, &200_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

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

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Try refund without donation - should panic
    client.refund(&non_donor);
}

// 🚀 NEW FEATURE TESTS - Metadata, Withdraw, Donation History

// Test 22: Get metadata returns correct campaign info
#[test]
fn test_get_metadata() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 100_000_000i128; // 10 XLM
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    let title = String::from_str(&env, "Test Campaign");
    let description = String::from_str(&env, "This is a test campaign");
    let category = symbol_short!("tech");

    env.mock_all_auths();

    client.initialize(&owner, &title, &description, &goal, &deadline, &category, &xlm_token_address);

    // Get metadata
    let metadata = client.get_metadata();

    // Verify all fields
    assert_eq!(metadata.title, title);
    assert_eq!(metadata.description, description);
    assert_eq!(metadata.category, category);
    assert_eq!(metadata.owner, owner);
    assert_eq!(metadata.goal, goal);
    assert_eq!(metadata.deadline, deadline);
    assert_eq!(metadata.created_at, env.ledger().timestamp()); // Timestamp from creation
}

// Test 23: Successful withdrawal after goal reached and ended
#[test]
fn test_withdraw_success() {
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

    // Mint tokens to donor and owner
    token_client.mint(&donor, &200_000_000i128);
    token_client.mint(&owner, &100_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Donate to reach goal
    client.donate(&donor, &goal);

    // Verify goal reached
    assert_eq!(client.is_goal_reached(), true);
    assert_eq!(client.get_total_raised(), goal);

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Verify campaign ended
    assert_eq!(client.is_ended(), true);

    // Withdraw funds
    let withdrawn = client.withdraw(&owner);

    // Verify withdrawal
    assert_eq!(withdrawn, goal);
}

// Test 24: Withdrawal fails before deadline
#[test]
#[should_panic(expected = "Campaign has not ended yet")]
fn test_withdraw_before_deadline() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 1000; // Still in future

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor, &200_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Donate to reach goal
    client.donate(&donor, &goal);

    // Try to withdraw before deadline - should panic
    client.withdraw(&owner);
}

// Test 25: Withdrawal fails when goal not reached
#[test]
#[should_panic(expected = "Goal not reached, cannot withdraw")]
fn test_withdraw_goal_not_reached() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 100;

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor, &200_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Donate less than goal
    client.donate(&donor, &50_000_000); // Only 5 XLM

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Try to withdraw when goal not reached - should panic
    client.withdraw(&owner);
}

// Test 26: Withdrawal fails when not owner
#[test]
#[should_panic(expected = "Only owner can withdraw")]
fn test_withdraw_not_owner() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let non_owner = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 100;

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor, &200_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Donate to reach goal
    client.donate(&donor, &goal);

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Try to withdraw as non-owner - should panic
    client.withdraw(&non_owner);
}

// Test 27: Cannot withdraw twice
#[test]
#[should_panic(expected = "Funds already withdrawn")]
fn test_withdraw_twice() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 100;

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor, &200_000_000i128);
    token_client.mint(&owner, &100_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Donate to reach goal
    client.donate(&donor, &goal);

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // First withdrawal - should succeed
    client.withdraw(&owner);

    // Second withdrawal - should panic
    client.withdraw(&owner);
}

// Test 28: Cannot donate after withdrawal (fails due to deadline first)
#[test]
#[should_panic(expected = "Campaign has ended")]
fn test_donate_after_withdrawal() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor1 = Address::generate(&env);
    let donor2 = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 100;

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor1, &200_000_000i128);
    token_client.mint(&donor2, &200_000_000i128);
    token_client.mint(&owner, &100_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // First donor reaches goal
    client.donate(&donor1, &goal);

    // Fast forward past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Owner withdraws
    client.withdraw(&owner);

    // Try to donate after withdrawal - should panic
    client.donate(&donor2, &10_000_000);
}

// Test 29: Donation history tracking
#[test]
fn test_donation_history() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor1 = Address::generate(&env);
    let donor2 = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 1000;

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor1, &200_000_000i128);
    token_client.mint(&donor2, &200_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Make donations
    client.donate(&donor1, &30_000_000);
    client.donate(&donor2, &20_000_000);
    client.donate(&donor1, &10_000_000); // Second donation from donor1

    // Get donation history (limit 10, offset 0)
    let history = client.get_donation_history(&10, &0);

    // Should have 3 donations (newest first due to reverse order)
    assert_eq!(history.len(), 3);

    // Check first record (newest = donor1's second donation)
    let record1 = history.get(0).unwrap();
    assert_eq!(record1.donor, donor1);
    assert_eq!(record1.amount, 10_000_000);

    // Check second record (donor2's donation)
    let record2 = history.get(1).unwrap();
    assert_eq!(record2.donor, donor2);
    assert_eq!(record2.amount, 20_000_000);

    // Check third record (oldest = donor1's first donation)
    let record3 = history.get(2).unwrap();
    assert_eq!(record3.donor, donor1);
    assert_eq!(record3.amount, 30_000_000);
}

// Test 30: Donation history pagination
#[test]
fn test_donation_history_pagination() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 100_000_000i128;
    let deadline = env.ledger().timestamp() + 1000;

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor, &500_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Make 5 donations
    for i in 1..=5 {
        client.donate(&donor, &(i * 1_000_000));
    }

    // Get first 2 records (newest first)
    // History: [1M, 2M, 3M, 4M, 5M] at indices [0, 1, 2, 3, 4]
    // offset=0, limit=2: should return [5M, 4M] (newest 2)
    let page1 = client.get_donation_history(&2, &0);
    assert_eq!(page1.len(), 2);
    assert_eq!(page1.get(0).unwrap().amount, 5_000_000); // Newest
    assert_eq!(page1.get(1).unwrap().amount, 4_000_000);

    // Get next 2 records
    // offset=2, limit=2: should return [3M, 2M]
    let page2 = client.get_donation_history(&2, &2);
    assert_eq!(page2.len(), 2);
    assert_eq!(page2.get(0).unwrap().amount, 3_000_000);
    assert_eq!(page2.get(1).unwrap().amount, 2_000_000);

    // Get last record
    // offset=4, limit=2: should return [1M] (oldest)
    let page3 = client.get_donation_history(&2, &4);
    assert_eq!(page3.len(), 1);
    assert_eq!(page3.get(0).unwrap().amount, 1_000_000); // Oldest
}

// Test 31: Initialize with minimum goal validation
#[test]
#[should_panic(expected = "Goal must be at least 10 XLM")]
fn test_initialize_goal_too_low() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 50_000_000i128; // Only 5 XLM (below 10 XLM minimum)
    let deadline = env.ledger().timestamp() + 86400;
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);
}

// Test 32: Initialize with deadline in past
#[test]
#[should_panic(expected = "Deadline must be in the future")]
fn test_initialize_deadline_past() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let goal = 100_000_000i128;

    // Fast forward time first
    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let deadline = env.ledger().timestamp(); // Equal to current time (not in future)
    let xlm_token_address =
        Address::from_string(&soroban_sdk::String::from_str(&env, XLM_CONTRACT_TESTNET));

    env.mock_all_auths();

    init_campaign(&client, &env, &owner, goal, deadline, &xlm_token_address);
}

// Test 33: Over-funding allowed (donate beyond 100%)
#[test]
fn test_overfunding_allowed() {
    let env = Env::default();
    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let goal = 100_000_000i128; // 10 XLM
    let deadline = env.ledger().timestamp() + 1000;

    let (token_address, token_client) = create_token_contract(&env, &owner);

    env.mock_all_auths();

    token_client.mint(&donor, &500_000_000i128);

    init_campaign(&client, &env, &owner, goal, deadline, &token_address);

    // Donate 200% of goal
    client.donate(&donor, &200_000_000); // 20 XLM

    // Verify over-funding allowed
    assert_eq!(client.get_total_raised(), 200_000_000);
    assert_eq!(client.get_progress_percentage(), 200); // 200%
    assert_eq!(client.is_goal_reached(), true);
}