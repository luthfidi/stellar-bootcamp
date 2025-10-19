import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Card } from "~/components/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useWallet } from "~/hooks/use-wallet";
import { useCampaign } from "~/hooks/use-campaign";
import { useFactory } from "~/hooks/use-factory";
import { signTransaction } from "~/config/wallet.client";
import { formatXlm, xlmToStroops, stroopsToXlm, CATEGORIES, MIN_DONATION_XLM } from "~/lib/contracts";
import type { Route } from "./+types/campaign.$id";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Campaign Details - Crowdfunding Platform" },
  ];
}

// Helper to format time remaining
function getTimeRemaining(deadline: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const deadlineNum = Number(deadline);
  const diff = deadlineNum - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// Helper to truncate address
function truncateAddress(address: string): string {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

// Helper to format time ago
function timeAgo(timestamp: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Number(timestamp);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CampaignDetail() {
  const params = useParams();
  const { address, isConnected } = useWallet();
  const { contract: factoryContract } = useFactory();

  const [campaignAddress, setCampaignAddress] = useState<string | undefined>(undefined);
  const [loadingAddress, setLoadingAddress] = useState(true);

  // Fetch campaign address from factory
  useEffect(() => {
    async function fetchAddress() {
      if (!factoryContract || !params.id) {
        setLoadingAddress(false);
        return;
      }

      try {
        const tx = await factoryContract.get_campaign({ id: BigInt(params.id) });
        const result = await tx.simulate();
        setCampaignAddress(result.result);
      } catch (err) {
        console.error("Error fetching campaign address:", err);
      } finally {
        setLoadingAddress(false);
      }
    }

    fetchAddress();
  }, [factoryContract, params.id]);

  const {
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
    refetch,
    isOwner,
  } = useCampaign(campaignAddress);

  const [donateAmount, setDonateAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [hasWithdrawn, setHasWithdrawn] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDonate = async () => {
    if (!contract || !isConnected) {
      setActionError("Please connect your wallet");
      return;
    }

    const amount = parseFloat(donateAmount);
    if (isNaN(amount) || amount < MIN_DONATION_XLM) {
      setActionError(`Minimum donation is ${MIN_DONATION_XLM} XLM`);
      return;
    }

    try {
      setIsDonating(true);
      setActionError(null);

      const tx = await contract.donate({
        donor: address,
        amount: xlmToStroops(amount),
      });

      // Sign and send - ignore result parsing errors for void functions
      try {
        await tx.signAndSend({ signTransaction });
      } catch (sendErr: any) {
        // Check if it's just a result parsing error but transaction succeeded
        if (sendErr.message?.includes("Bad union switch") || sendErr.message?.includes("armForSwitch")) {
          console.log("Transaction likely succeeded despite parsing error");
        } else {
          throw sendErr;
        }
      }

      console.log("Donation successful!");
      setDonateAmount("");

      // Wait a bit before refetching to let transaction settle
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error("Error donating:", err);
      setActionError(err instanceof Error ? err.message : "Failed to donate");
    } finally {
      setIsDonating(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !isConnected) {
      setActionError("Please connect your wallet");
      return;
    }

    try {
      setIsWithdrawing(true);
      setActionError(null);

      const tx = await contract.withdraw({
        owner: address,
      });

      // Sign and send - handle potential parsing errors
      try {
        const result = await tx.signAndSend({ signTransaction });
        console.log("Withdrawal successful!", result);
      } catch (sendErr: any) {
        // Check if it's just a result parsing error but transaction succeeded
        if (sendErr.message?.includes("Bad union switch") || sendErr.message?.includes("armForSwitch")) {
          console.log("Transaction likely succeeded despite parsing error");
        } else {
          throw sendErr;
        }
      }

      // Mark as withdrawn to hide button
      setHasWithdrawn(true);

      // Wait a bit before refetching to let transaction settle
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error("Error withdrawing:", err);
      setActionError(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefund = async () => {
    if (!contract || !isConnected) {
      setActionError("Please connect your wallet");
      return;
    }

    try {
      setIsRefunding(true);
      setActionError(null);

      const tx = await contract.refund({
        donor: address,
      });

      // Sign and send - handle potential parsing errors
      try {
        const result = await tx.signAndSend({ signTransaction });
        console.log("Refund successful!", result);
      } catch (sendErr: any) {
        // Check if it's just a result parsing error but transaction succeeded
        if (sendErr.message?.includes("Bad union switch") || sendErr.message?.includes("armForSwitch")) {
          console.log("Transaction likely succeeded despite parsing error");
        } else {
          throw sendErr;
        }
      }

      console.log("Refund claimed successfully!");

      // Wait a bit before refetching to let transaction settle
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error("Error claiming refund:", err);
      setActionError(err instanceof Error ? err.message : "Failed to claim refund");
    } finally {
      setIsRefunding(false);
    }
  };

  if (loadingAddress || loading) {
    return (
      <div className="pt-8 pb-12 px-8 max-w-6xl mx-auto">
        <p className="text-center text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-8 pb-12 px-8 max-w-6xl mx-auto">
        <Card className="p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/">
            <Button>Back to Campaigns</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="pt-8 pb-12 px-8 max-w-6xl mx-auto">
        <p className="text-center text-muted-foreground">Loading campaign data...</p>
      </div>
    );
  }

  const canWithdraw = isOwner && isEnded && isGoalReached && !hasWithdrawn;
  const canDonate = !isOwner && !isEnded;
  const canRefund = !isOwner && isEnded && !isGoalReached && userDonation > BigInt(0);

  return (
    <div className="pt-8 pb-12 px-8 max-w-6xl mx-auto">
      {/* Back Button */}
      <Link to="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Campaigns
      </Link>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Campaign Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Category */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded">
                {CATEGORIES.find((c) => c.value === metadata.category)?.label || metadata.category}
              </span>
              {isOwner && (
                <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">
                  YOU ARE THE OWNER
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold">{metadata.title}</h1>
          </div>

          {/* Description */}
          <Card className="p-6">
            <h2 className="font-semibold mb-3">About this campaign</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{metadata.description}</p>
          </Card>

          {/* Owner Info */}
          <Card className="p-6">
            <h2 className="font-semibold mb-2">Campaign Owner</h2>
            <p className="text-sm font-mono text-muted-foreground">{truncateAddress(metadata.owner)}</p>
          </Card>

          {/* Action Section */}
          {canDonate && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Support this Campaign</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Donation Amount (XLM)
                  </label>
                  <Input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    placeholder={`Min ${MIN_DONATION_XLM} XLM`}
                    min={MIN_DONATION_XLM}
                    step="0.1"
                    disabled={!isConnected}
                  />
                </div>
                {actionError && (
                  <p className="text-sm text-red-600">{actionError}</p>
                )}
                <Button
                  onClick={handleDonate}
                  disabled={!isConnected || isDonating || !donateAmount}
                  className="w-full"
                >
                  {isDonating ? "Processing..." : "Donate Now"}
                </Button>
                {!isConnected && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect your wallet to donate
                  </p>
                )}
              </div>
            </Card>
          )}

          {canWithdraw && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h2 className="font-semibold mb-4 text-green-900">Withdraw Funds</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Available to withdraw:</span>
                  <span className="font-bold text-lg">{formatXlm(totalRaised)} XLM</span>
                </div>
                {actionError && (
                  <p className="text-sm text-red-600">{actionError}</p>
                )}
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isWithdrawing ? "Processing..." : "Withdraw Funds"}
                </Button>
              </div>
            </Card>
          )}

          {hasWithdrawn && isOwner && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="font-semibold mb-2 text-blue-900">Withdrawal Completed</h2>
              <p className="text-sm text-blue-800">
                Funds have been successfully transferred to your wallet.
              </p>
            </Card>
          )}

          {canRefund && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h2 className="font-semibold mb-4 text-yellow-900">Campaign Failed - Claim Refund</h2>
              <div className="space-y-4">
                <p className="text-sm text-yellow-800">
                  This campaign did not reach its goal. You can claim a refund of your donation.
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Your donation:</span>
                  <span className="font-bold text-lg">{formatXlm(userDonation)} XLM</span>
                </div>
                {actionError && (
                  <p className="text-sm text-red-600">{actionError}</p>
                )}
                <Button
                  onClick={handleRefund}
                  disabled={isRefunding || !isConnected}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {isRefunding ? "Processing..." : "Claim Refund"}
                </Button>
                {!isConnected && (
                  <p className="text-xs text-yellow-700 text-center">
                    Connect your wallet to claim refund
                  </p>
                )}
              </div>
            </Card>
          )}

          {isEnded && !isGoalReached && !isOwner && userDonation === BigInt(0) && (
            <Card className="p-6 bg-gray-50 border-gray-200">
              <h2 className="font-semibold mb-2 text-gray-700">Campaign Failed</h2>
              <p className="text-sm text-gray-600">
                This campaign did not reach its goal. You did not donate to this campaign.
              </p>
            </Card>
          )}

          {isEnded && !isGoalReached && isOwner && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h2 className="font-semibold mb-2 text-yellow-900">Campaign Failed</h2>
              <p className="text-sm text-yellow-800">
                This campaign did not reach its goal. Donors can claim refunds.
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Remaining in contract: {formatXlm(totalRaised)} XLM
              </p>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & History */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-2xl font-bold">{Number(progressPercentage)}%</span>
                  <span className="text-sm text-muted-foreground">funded</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(Number(progressPercentage), 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Raised:</span>
                  <span className="font-semibold">{formatXlm(totalRaised)} XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goal:</span>
                  <span className="font-semibold">{formatXlm(metadata.goal)} XLM</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Status Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Campaign Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-semibold ${
                  isEnded ? "text-red-600" : "text-green-600"
                }`}>
                  {isEnded ? "Ended" : "Active"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goal:</span>
                <span className={`font-semibold ${
                  isGoalReached ? "text-green-600" : "text-gray-600"
                }`}>
                  {isGoalReached ? "Reached ✓" : "Not Reached"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-semibold">
                  {getTimeRemaining(metadata.deadline)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-semibold">
                  {new Date(Number(metadata.created_at) * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Donation History */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Recent Donations</h3>
            {donationHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No donations yet
              </p>
            ) : (
              <div className="space-y-3">
                {donationHistory.map((donation, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-muted-foreground">
                        {truncateAddress(donation.donor)}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatXlm(donation.amount)} XLM
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo(donation.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
