#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

// Basic tests for factory contract
// Note: Full integration tests will be added after campaign contract update

#[test]
fn test_get_campaign_count_initial() {
    let env = Env::default();
    let contract_id = env.register(FactoryContract, ());
    let client = FactoryContractClient::new(&env, &contract_id);

    // Initial count should be 0
    assert_eq!(client.get_campaign_count(), 0);
}

#[test]
fn test_get_all_campaigns_initial() {
    let env = Env::default();
    let contract_id = env.register(FactoryContract, ());
    let client = FactoryContractClient::new(&env, &contract_id);

    // Initial campaigns list should be empty
    let campaigns = client.get_all_campaigns();
    assert_eq!(campaigns.len(), 0);
}

#[test]
fn test_get_campaigns_by_owner_empty() {
    let env = Env::default();
    let contract_id = env.register(FactoryContract, ());
    let client = FactoryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    // No campaigns for owner
    let owner_campaigns = client.get_campaigns_by_owner(&owner);
    assert_eq!(owner_campaigns.len(), 0);
}

// TODO: Add full integration tests after campaign contract is updated with metadata
// These tests will include:
// - test_create_campaign_success()
// - test_create_campaign_invalid_goal()
// - test_create_campaign_invalid_deadline()
// - test_get_campaign_by_id()
// - test_get_campaigns_by_owner()
// - test_multiple_campaigns()
