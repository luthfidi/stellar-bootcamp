import { Card } from "~/components/card";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { useWallet } from "~/hooks/use-wallet";
import { useCampaigns } from "~/hooks/use-campaigns";
import { Link } from "react-router";
import { useState } from "react";
import { CATEGORIES } from "~/lib/contracts";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Crowdfunding Platform - Browse Campaigns" },
    { name: "description", content: "Browse and support campaigns on Stellar blockchain" },
  ];
}

export default function Home() {
  const { address, isConnected } = useWallet();
  const { campaigns, loading, error } = useCampaigns();
  const [filter, setFilter] = useState<"all" | "my" | "active">("all");

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === "my") {
      return campaign.owner === address;
    }
    return true;
  });

  return (
    <div className="pt-4 pb-12 px-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold tracking-tight">
            Support Innovation on Stellar
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse campaigns and make a difference with XLM on Stellar blockchain
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All Campaigns
          </Button>
          <Button
            variant={filter === "my" ? "default" : "outline"}
            onClick={() => setFilter("my")}
            disabled={!isConnected}
          >
            My Campaigns
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
          >
            Active
          </Button>
        </div>

        <Link to="/create">
          <Button size="lg" disabled={!isConnected}>
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200 mb-6">
          <p className="text-red-900 text-sm">Error loading campaigns: {error}</p>
        </Card>
      )}

      {/* Campaigns Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Card className="p-12">
            <p className="text-lg text-muted-foreground mb-4">
              No campaigns found
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to create a campaign!
            </p>
            <Link to="/create">
              <Button disabled={!isConnected}>
                Create Campaign
              </Button>
            </Link>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Link key={Number(campaign.id)} to={`/campaign/${campaign.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {campaign.title}
                    </h3>
                    {campaign.owner === address && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        OWNER
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {CATEGORIES.find((c) => c.value === campaign.category)?.label || campaign.category}
                    </span>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(Number(campaign.created_at) * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Connect Wallet Prompt */}
      {!isConnected && (
        <div className="mt-8">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <p className="text-center text-sm text-blue-900">
              Connect your wallet to create campaigns and donate
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
