import { useMemo, useState, useEffect, useCallback } from "react";
import { useWallet } from "./use-wallet";
import * as Campaign from "../../packages/campaign";
import { NETWORK } from "~/lib/contracts";

export interface CampaignMetadata {
  title: string;
  description: string;
  category: string;
  owner: string;
  goal: bigint;
  deadline: bigint;
  created_at: bigint;
}

export interface DonationRecord {
  donor: string;
  amount: bigint;
  timestamp: bigint;
}

export function useCampaign(campaignAddress: string | undefined) {
  const { address, isConnected } = useWallet();
  const [metadata, setMetadata] = useState<CampaignMetadata | null>(null);
  const [totalRaised, setTotalRaised] = useState<bigint>(BigInt(0));
  const [isEnded, setIsEnded] = useState(false);
  const [isGoalReached, setIsGoalReached] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState<bigint>(BigInt(0));
  const [donationHistory, setDonationHistory] = useState<DonationRecord[]>([]);
  const [userDonation, setUserDonation] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contract = useMemo(() => {
    if (!campaignAddress || !isConnected || address === "-") return null;

    return new Campaign.Client({
      ...Campaign.networks.testnet,
      contractId: campaignAddress,
      rpcUrl: NETWORK.rpcUrl,
      publicKey: address,
    });
  }, [campaignAddress, isConnected, address]);

  const fetchCampaignData = useCallback(async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build all transactions
      const [
        metadataTx,
        totalRaisedTx,
        isEndedTx,
        isGoalReachedTx,
        progressTx,
        historyTx,
        userDonationTx,
      ] = await Promise.all([
        contract.get_metadata(),
        contract.get_total_raised(),
        contract.is_ended(),
        contract.is_goal_reached(),
        contract.get_progress_percentage(),
        contract.get_donation_history({ limit: 20, offset: 0 }),
        contract.get_donation({ donor: address }),
      ]);

      // Simulate all transactions to get results
      const [
        metadataResult,
        totalRaisedResult,
        isEndedResult,
        isGoalReachedResult,
        progressResult,
        historyResult,
        userDonationResult,
      ] = await Promise.all([
        metadataTx.simulate(),
        totalRaisedTx.simulate(),
        isEndedTx.simulate(),
        isGoalReachedTx.simulate(),
        progressTx.simulate(),
        historyTx.simulate(),
        userDonationTx.simulate(),
      ]);

      console.log("Campaign metadata raw:", metadataResult.result);
      console.log("Donation history raw:", historyResult.result);
      console.log("User donation amount:", userDonationResult.result);

      setMetadata(metadataResult.result);
      setTotalRaised(totalRaisedResult.result);
      setIsEnded(isEndedResult.result);
      setIsGoalReached(isGoalReachedResult.result);
      setProgressPercentage(progressResult.result);
      setDonationHistory(historyResult.result || []);
      setUserDonation(userDonationResult.result || BigInt(0));
    } catch (err) {
      console.error("Error fetching campaign data:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      setError(err instanceof Error ? err.message : "Failed to fetch campaign data");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  return {
    contract,
    metadata,
    totalRaised,
    isEnded,
    isGoalReached,
    progressPercentage,
    donationHistory,
    userDonation,
    loading,
    error,
    refetch: fetchCampaignData,
    isOwner: metadata?.owner === address,
  };
}
