import { Button } from "~/components/ui/button";
import { useWallet } from "~/hooks/use-wallet";
import { Wallet } from "lucide-react";

export function ConnectWallet() {
  const { address, isConnected, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    if (addr === "-") return "-";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-3">
      {isConnected && address !== "-" && (
        <span className="text-sm text-muted-foreground hidden md:inline">
          {formatAddress(address)}
        </span>
      )}
      <Button
        onClick={isConnected ? disconnect : connect}
        variant={isConnected ? "outline" : "default"}
        size="sm"
        className="gap-2"
      >
        <Wallet className="size-4" />
        {isConnected ? "Disconnect" : "Connect Wallet"}
      </Button>
    </div>
  );
}
