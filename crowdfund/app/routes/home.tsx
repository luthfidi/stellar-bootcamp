import { Card } from "~/components/card";
import type { Route } from "./+types/home";
import { TextRotate } from "~/components/text-rotate";
import { Donut } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useWallet } from "~/hooks/use-wallet";
import { useNativeBalance } from "~/hooks/use-native-balance";
import { useSubmitTransaction } from "~/hooks/use-submit-transaction";
import * as Crowdfund from "../../packages/CBNB37OEW7XFHGEBMEIRSNZY3LYI4ZJQIXH43S2ES3VP65DMNVA66AWF";
import { signTransaction } from "~/config/wallet.client";
import { useState, useMemo, useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Crowdfund - Support Stellar Development" },
    { name: "description", content: "Support the Stellar ecosystem by donating XLM. Every contribution helps us build better tools for developers." },
  ];
}

export default function Home() {
  const RPC_URL = "https://soroban-testnet.stellar.org:443";
  const NATIVE_XLM_CONTRACT = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; // Native XLM on testnet

  const { address, isConnected } = useWallet();
  const { balance, refetch: refetchBalance } = useNativeBalance(address);

  const [amount, setAmount] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCheckingInit, setIsCheckingInit] = useState(true);

  // Initialization form states
  const [goal, setGoal] = useState<string>("100"); // Default 100 XLM
  const [daysUntilDeadline, setDaysUntilDeadline] = useState<string>("5"); // Default 7 days (1 week)

  // Campaign state from contract
  const [campaignGoal, setCampaignGoal] = useState<number>(0);
  const [campaignDeadline, setCampaignDeadline] = useState<number>(0);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [isGoalReached, setIsGoalReached] = useState<boolean>(false);
  const [campaignOwner, setCampaignOwner] = useState<string>("");

  const contract = useMemo(() => {
    if (!isConnected || address === "-") return null;

    return new Crowdfund.Client({
      ...Crowdfund.networks.testnet,
      rpcUrl: RPC_URL,
      signTransaction,
      publicKey: address,
    });
  }, [isConnected, address]);

  const { submit, isSubmitting } = useSubmitTransaction({
    rpcUrl: RPC_URL,
    networkPassphrase: Crowdfund.networks.testnet.networkPassphrase,
    onSuccess: handleOnSuccess,
    onError: (error) => {
      console.error("Donation failed", error);
    },
  });

  async function handleOnSuccess() {
    // Refresh contract state
    if (contract) {
      try {
        // Check if just initialized
        const initTx = await contract.get_is_already_init();
        const initialized = initTx.result as boolean;
        setIsInitialized(initialized);

        // If initialized, fetch all campaign data
        if (initialized) {
          setPreviousTotal(total);

          // Fetch all contract data
          const [totalTx, goalTx, deadlineTx, progressTx, endedTx, goalReachedTx, ownerTx] = await Promise.all([
            contract.get_total_raised(),
            contract.get_goal(),
            contract.get_deadline(),
            contract.get_progress_percentage(),
            contract.is_ended(),
            contract.is_goal_reached(),
            contract.get_owner(),
          ]);

          setTotal(Number(BigInt(totalTx.result as any)));
          setCampaignGoal(Number(BigInt(goalTx.result as any)));
          setCampaignDeadline(Number(BigInt(deadlineTx.result as any)));
          setProgressPercentage(Number(BigInt(progressTx.result as any)));
          setIsEnded(endedTx.result as boolean);
          setIsGoalReached(goalReachedTx.result as boolean);
          setCampaignOwner(ownerTx.result as string);
        }
      } catch (err) {
        console.error("Error refreshing state:", err);
      }
    }
    await refetchBalance();
    setAmount("");
  }

  async function handleSubmit() {
    if (!isConnected || !contract) return;
    if (!amount.trim()) return;

    try {
      // Convert XLM to stroops (multiply by 10^7)
      const xlmAmount = parseFloat(amount.trim());
      const stroopsAmount = Math.floor(xlmAmount * 10_000_000);

      const tx = (await contract.donate({
        donor: address,
        amount: BigInt(stroopsAmount),
      })) as any;

      await submit(tx);
    } catch (e) {
      console.error("Failed to create donation transaction", e);
    }
  }

  // Check if contract is initialized
  useEffect(() => {
    // Don't mark as done checking if we're waiting for contract to be created
    if (!contract) {
      // Only set to false if user is not connected (no point in showing loading)
      if (!isConnected) {
        setIsCheckingInit(false);
      }
      return;
    }

    // Contract exists, now we can check initialization
    (async () => {
      try {
        const initTx = await contract.get_is_already_init();
        const initialized = initTx.result as boolean;
        setIsInitialized(initialized);

        // If initialized, fetch all campaign data
        if (initialized) {
          const [totalTx, goalTx, deadlineTx, progressTx, endedTx, goalReachedTx, ownerTx] = await Promise.all([
            contract.get_total_raised(),
            contract.get_goal(),
            contract.get_deadline(),
            contract.get_progress_percentage(),
            contract.is_ended(),
            contract.is_goal_reached(),
            contract.get_owner(),
          ]);

          setTotal(Number(BigInt(totalTx.result as any)));
          setCampaignGoal(Number(BigInt(goalTx.result as any)));
          setCampaignDeadline(Number(BigInt(deadlineTx.result as any)));
          setProgressPercentage(Number(BigInt(progressTx.result as any)));
          setIsEnded(endedTx.result as boolean);
          setIsGoalReached(goalReachedTx.result as boolean);
          setCampaignOwner(ownerTx.result as string);
        }
      } catch (err) {
        console.error("Error checking initialization:", err);
        setIsInitialized(false);
        setTotal(0);
      } finally {
        setIsCheckingInit(false);
      }
    })();
  }, [contract, isConnected]);

  async function handleInitialize() {
    if (!isConnected || !contract) return;
    if (!goal.trim() || !daysUntilDeadline.trim()) return;

    try {
      const goalAmount = Math.floor(parseFloat(goal) * 10_000_000); // Convert XLM to stroops
      const deadline = Math.floor(Date.now() / 1000) + (parseInt(daysUntilDeadline) * 24 * 60 * 60); // Current time + days in seconds

      const tx = await contract.initialize({
        owner: address,
        goal: BigInt(goalAmount),
        deadline: BigInt(deadline),
        xlm_token: NATIVE_XLM_CONTRACT,
      }) as any;

      await submit(tx);
    } catch (e) {
      console.error("Failed to initialize contract", e);
    }
  }

  async function handleRefund() {
    if (!isConnected || !contract) return;

    try {
      const tx = await contract.refund({
        donor: address,
      }) as any;

      await submit(tx);
    } catch (e) {
      console.error("Failed to refund", e);
    }
  }

  // Helper function to format deadline
  function formatDeadline(timestamp: number): string {
    if (timestamp === 0) return "-";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  }

  // Helper function to calculate time remaining
  function getTimeRemaining(deadline: number): string {
    if (deadline === 0) return "-";
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;

    if (remaining <= 0) return "Campaign Ended";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }

  // Helper function to truncate address
  function truncateAddress(address: string, startChars = 6, endChars = 4): string {
    if (!address || address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  return (
    <div className="flex flex-col items-center pb-4 pt-4">
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-y-2 text-center mb-6">
        <div className="flex flex-row items-center gap-x-6">
          <p className="text-4xl md:text-5xl font-bold">Learning</p>
          <TextRotate
            texts={["Stellar", "Rust", "Contract", "Frontend"]}
            mainClassName="bg-white text-black rounded-xl text-4xl md:text-5xl px-7 py-3.5 font-bold shadow-sm"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </div>
        <p className="text-muted-foreground text-base max-w-2xl">
          Support the project by donating XLM. Your contribution helps us build better tools for the Stellar ecosystem.
        </p>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="w-full max-w-6xl px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Donation/Initialize Card */}
          <Card className="flex flex-col gap-y-5 py-6 px-8 h-fit">
        {isCheckingInit ? (
          // Loading state
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Checking contract status...</p>
          </div>
        ) : !isInitialized ? (
          // Initialize Form
          <>
            <div className="flex flex-col gap-2">
              <h2 className="flex flex-row items-center gap-x-2 text-2xl font-semibold">
                <Donut className="size-6" />
                Initialize Campaign
              </h2>
              <p className="text-sm text-muted-foreground">
                Set up your crowdfunding campaign to start accepting donations
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Goal Amount (XLM)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="100"
                  onChange={(e) => setGoal(e.target.value)}
                  value={goal}
                  disabled={isSubmitting || !isConnected}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Campaign Duration (Days)</label>
                <Input
                  type="number"
                  placeholder="5"
                  onChange={(e) => setDaysUntilDeadline(e.target.value)}
                  value={daysUntilDeadline}
                  disabled={isSubmitting || !isConnected}
                />
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleInitialize}
              disabled={!isConnected || isSubmitting || !goal.trim() || !daysUntilDeadline.trim()}
            >
              {isSubmitting ? "Initializing..." : "Initialize Campaign"}
            </Button>

            {!isConnected && (
              <p className="text-xs text-center text-muted-foreground">
                Please connect your wallet to initialize the campaign
              </p>
            )}
          </>
        ) : (
          // Donate Form
          <>
            <div className="flex flex-col gap-2">
              <h2 className="flex flex-row items-center gap-x-2 text-2xl font-semibold">
                <Donut className="size-6" />
                Make a Donation
              </h2>
              <p className="text-sm text-muted-foreground">
                Every contribution makes a difference
              </p>
            </div>

            {/* Balance Display */}
            <div className="flex flex-row justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-row items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  XLM
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground">Your Balance</p>
                  <p className="tabular-nums font-medium">
                    {!isConnected && <span className="text-muted-foreground">Not connected</span>}
                    {isConnected && balance === "-" && <span>-</span>}
                    {isConnected && balance !== "-" && (
                      <span>{balance} XLM</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Amount (XLM)</label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.001"
                onChange={(e) => setAmount(e.target.value)}
                value={amount}
                disabled={isSubmitting || !isConnected}
                className="text-lg"
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!isConnected || isSubmitting || !amount.trim()}
            >
              {isSubmitting ? "Processing..." : "Donate Now"}
            </Button>

            {!isConnected && (
              <p className="text-xs text-center text-muted-foreground">
                Please connect your wallet to make a donation
              </p>
            )}
          </>
        )}
          </Card>

          {/* Right Column - Campaign Stats */}
          {isInitialized && !isCheckingInit && (
            <div className="flex flex-col gap-3">
              {/* Progress Bar */}
              <Card className="p-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-row justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Campaign Progress</p>
                      <p className="text-2xl font-bold tabular-nums">
                        {progressPercentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Raised</p>
                      <p className="text-xl font-semibold tabular-nums">
                        {(total / 10_000_000).toFixed(2)} XLM
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex flex-row justify-between text-xs text-muted-foreground">
                    <span>Goal: {(campaignGoal / 10_000_000).toFixed(2)} XLM</span>
                    <span>{getTimeRemaining(campaignDeadline)}</span>
                  </div>

                  {previousTotal > 0 && previousTotal !== total && (
                    <p className="text-xs text-green-500 font-medium animate-in fade-in slide-in-from-bottom-2 text-center">
                      +{((total - previousTotal) / 10_000_000).toFixed(7)} XLM just added! 🎉
                    </p>
                  )}
                </div>
              </Card>

              {/* Campaign Details */}
              <div className="grid grid-cols-3 gap-2">
                {/* Goal */}
                <Card className="p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Goal</p>
                  <p className="text-sm font-bold tabular-nums">{(campaignGoal / 10_000_000).toFixed(2)} XLM</p>
                </Card>

                {/* Deadline */}
                <Card className="p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Deadline</p>
                  <p className="text-[10px] font-medium leading-tight">{formatDeadline(campaignDeadline)}</p>
                </Card>

                {/* Status */}
                <Card className="p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <div className="flex flex-col gap-1">
                    {isGoalReached && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-600 w-fit">
                        ✓ Goal
                      </span>
                    )}
                    {!isGoalReached && !isEnded && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-600 w-fit">
                        ⏳ Active
                      </span>
                    )}
                    {isEnded && !isGoalReached && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-600 w-fit">
                        ✗ Failed
                      </span>
                    )}
                    {isEnded && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/20 text-gray-600 w-fit">
                        Ended
                      </span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Refund Button - Only show if campaign ended and goal not reached */}
              {isEnded && !isGoalReached && (
                <Card className="p-3 border-red-500/50 bg-red-500/5">
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <h3 className="text-base font-semibold text-red-600 mb-0.5">Campaign Failed</h3>
                      <p className="text-xs text-muted-foreground">
                        The campaign didn't reach its goal. You can request a refund for your donations.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleRefund}
                      disabled={!isConnected || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? "Processing Refund..." : "Request Refund"}
                    </Button>
                    {!isConnected && (
                      <p className="text-xs text-center text-muted-foreground">
                        Connect your wallet to request a refund
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* Owner Info */}
              <Card className="p-2.5 bg-muted/30">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Campaign Owner</p>
                  <p className="text-xs font-mono" title={campaignOwner}>
                    {truncateAddress(campaignOwner, 8, 6) || "-"}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
