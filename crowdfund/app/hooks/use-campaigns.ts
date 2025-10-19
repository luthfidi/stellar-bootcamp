import { useState, useEffect, useCallback } from "react";
import { useFactory } from "./use-factory";

export interface CampaignInfo {
  id: bigint;
  address: string;
  title: string;
  category: string;
  owner: string;
  created_at: bigint;
}

export function useCampaigns() {
  const { contract } = useFactory();
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all campaigns transaction
      const tx = await contract.get_all_campaigns();

      // Simulate to get the result
      const simulateResult = await tx.simulate();
      const campaignsData = simulateResult.result || [];

      console.log("Campaigns data:", campaignsData);

      // Map to CampaignInfo format
      const campaignsList: CampaignInfo[] = campaignsData.map((c: any) => ({
        id: c.id,
        address: c.address,
        title: c.title,
        category: c.category,
        owner: c.owner,
        created_at: c.created_at,
      }));

      setCampaigns(campaignsList);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
  };
}
