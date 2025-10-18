import { Card } from "~/components/card";
import type { Route } from "./+types/home";
import { TextRotate } from "~/components/text-rotate";
import { Donut } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useWallet } from "~/hooks/use-wallet";
import { useNativeBalance } from "~/hooks/use-native-balance";
import { useSubmitTransaction } from "~/hooks/use-submit-transaction";
import * as Crowdfund from "../../packages/CDA5SCOH634WICVGXNMID2Z4ZPFESFL7RQNKLVWHVR3OUCB6IE2YWSQN";
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
  const [daysUntilDeadline, setDaysUntilDeadline] = useState<string>("30"); // Default 30 days

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

        // If initialized, fetch updated total
        if (initialized) {
          setPreviousTotal(total);
          const totalTx = await contract.get_total_raised();
          const updated = BigInt(totalTx.result as any);
          setTotal(Number(updated));
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

        // If initialized, fetch total raised
        if (initialized) {
          const tx = await contract.get_total_raised();
          const total = Number(BigInt(tx.result));
          setTotal(total);
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

  return (
    <div className="flex flex-col items-center gap-y-12 pb-20">
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-y-8 text-center">
        <div className="flex flex-row items-center gap-x-6">
          <p className="text-4xl md:text-5xl font-bold">Learning</p>
          <TextRotate
            texts={["Stellar", "Rust", "Contract", "Frontend"]}
            mainClassName="bg-white text-black rounded-lg text-4xl md:text-5xl px-6 py-3 font-bold"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Support the project by donating XLM. Your contribution helps us build better tools for the Stellar ecosystem.
        </p>
      </div>

      {/* Main Card - Shows Initialize or Donate based on state */}
      <Card className="flex flex-col gap-y-6 py-8 px-10 w-full max-w-md">
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
                  placeholder="30"
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

      {/* Total Donations Stats - Only show if initialized */}
      {isInitialized && !isCheckingInit && (
        <div className="flex flex-col items-center gap-3 p-6 bg-muted/30 rounded-xl min-w-[300px]">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Total Donations Raised
          </p>
          <p className="text-4xl font-bold tabular-nums">
            {(total / 10_000_000).toFixed(2)} XLM
          </p>
          {previousTotal > 0 && previousTotal !== total && (
            <p className="text-sm text-green-500 font-medium animate-in fade-in slide-in-from-bottom-2">
              +{((total - previousTotal) / 10_000_000).toFixed(7)} XLM just added!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
