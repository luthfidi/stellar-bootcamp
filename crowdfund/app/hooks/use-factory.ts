import { useMemo } from "react";
import { useWallet } from "./use-wallet";
import * as Factory from "../../packages/factory";
import { CONTRACTS, NETWORK } from "~/lib/contracts";

export function useFactory() {
  const { address, isConnected } = useWallet();

  const contract = useMemo(() => {
    if (!isConnected || address === "-") return null;

    return new Factory.Client({
      ...Factory.networks.testnet,
      contractId: CONTRACTS.FACTORY,
      rpcUrl: NETWORK.rpcUrl,
      publicKey: address,
    });
  }, [isConnected, address]);

  return {
    contract,
    isReady: !!contract,
  };
}
