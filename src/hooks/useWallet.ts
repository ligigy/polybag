import { useMemo } from "react";
import {
  useAccount,
  useNetwork,
  useWalletClient,
  useContractRead,
  type Address,
} from "wagmi";
import { polygon, polygonAmoy } from "viem/chains";

const SUPPORTED_CHAIN_IDS = new Set<number>([polygon.id, polygonAmoy.id]);

export function useWalletAccount() {
  const account = useAccount();
  const network = useNetwork();
  const chainId = network.chain?.id;
  const unsupported = chainId ? !SUPPORTED_CHAIN_IDS.has(chainId) : false;
  return {
    address: account.address as Address | undefined,
    isConnected: account.isConnected,
    chainId,
    unsupported,
  };
}

export function usePolygonSigner() {
  const { data: walletClient } = useWalletClient();
  return walletClient;
}

export const usePolygonContractRead = useContractRead;

export function useSupportedChains() {
  return useMemo(() => ({
    primary: polygon.id,
    fallback: polygonAmoy.id,
    all: [polygon.id, polygonAmoy.id],
  }), []);
}
