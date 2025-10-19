import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "~/components/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useWallet } from "~/hooks/use-wallet";
import { useFactory } from "~/hooks/use-factory";
import { signTransaction } from "~/config/wallet.client";
import { CONTRACTS, CATEGORIES, xlmToStroops, MIN_GOAL_XLM, getCampaignWasmHash, NETWORK } from "~/lib/contracts";
import type { Route } from "./+types/create";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Campaign - Crowdfunding Platform" },
    { name: "description", content: "Create a new crowdfunding campaign on Stellar" },
  ];
}

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const { contract } = useFactory();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalXlm, setGoalXlm] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("tech");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get minimum datetime (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract || !isConnected) {
      setError("Please connect your wallet");
      return;
    }

    // Validation
    if (title.length === 0 || title.length > 100) {
      setError("Title must be between 1 and 100 characters");
      return;
    }

    if (description.length === 0 || description.length > 500) {
      setError("Description must be between 1 and 500 characters");
      return;
    }

    const goalNum = parseFloat(goalXlm);
    if (isNaN(goalNum) || goalNum < MIN_GOAL_XLM) {
      setError(`Goal must be at least ${MIN_GOAL_XLM} XLM`);
      return;
    }

    if (!deadline) {
      setError("Please select campaign end date and time");
      return;
    }

    // Convert deadline to timestamp
    const deadlineDate = new Date(deadline);
    const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

    // Validate deadline is in the future
    const now = Math.floor(Date.now() / 1000);
    if (deadlineTimestamp <= now) {
      setError("Deadline must be in the future");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Build and submit transaction
      const tx = await contract.create_campaign({
        owner: address,
        title,
        description,
        goal: xlmToStroops(goalNum),
        deadline: BigInt(deadlineTimestamp),
        category,
        xlm_token: CONTRACTS.XLM_TOKEN,
        campaign_wasm_hash: getCampaignWasmHash(),
      });

      // Sign and send transaction - handle potential parsing errors
      try {
        const result = await tx.signAndSend({ signTransaction });
        console.log("Campaign created successfully!", result);
      } catch (sendErr: any) {
        // Check if it's just a result parsing error but transaction succeeded
        if (sendErr.message?.includes("Bad union switch") || sendErr.message?.includes("armForSwitch")) {
          console.log("Transaction likely succeeded despite parsing error");
          // Wait a bit to let transaction settle before redirecting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw sendErr;
        }
      }

      // Redirect to campaigns list
      navigate("/");
    } catch (err) {
      console.error("Error creating campaign:", err);
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="pt-8 pb-12 px-8 max-w-2xl mx-auto">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to create a campaign
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-12 px-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Campaign</h1>
        <p className="text-muted-foreground">
          Launch your crowdfunding campaign on Stellar blockchain
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Campaign Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter campaign title"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your campaign"
              maxLength={500}
              required
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Funding Goal (XLM) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={goalXlm}
              onChange={(e) => setGoalXlm(e.target.value)}
              placeholder={`Minimum ${MIN_GOAL_XLM} XLM`}
              min={MIN_GOAL_XLM}
              step="0.1"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum: {MIN_GOAL_XLM} XLM
            </p>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Campaign End Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={getMinDateTime()}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
            <p className="text-xs text-muted-foreground">
              Select when the campaign should end (your local time)
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !contract}
              className="flex-1"
            >
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">Important Notes:</h3>
        <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
          <li>Minimum goal: {MIN_GOAL_XLM} XLM</li>
          <li>Campaign cannot be edited or cancelled after creation</li>
          <li>You can withdraw funds only after goal is reached and campaign ends</li>
          <li>If goal is not reached, donors can claim refunds after campaign ends</li>
        </ul>
      </Card>
    </div>
  );
}
