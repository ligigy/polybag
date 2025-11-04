'use client';
// Global app providers: RainbowKit + wagmi + React Query
// NOTE: Requires installing wagmi/viem/@rainbow-me/rainbowkit and react-query.

import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { ToastProvider } from '@/components/ui/toast';
import React from 'react';
import { HeroUIProvider } from '@heroui/react';

const config = getDefaultConfig({
  appName: 'Poly Grid Bot',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'YOUR_WC_PROJECT_ID',
  chains: [polygon, polygonAmoy],
  transports: {
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config as unknown as ReturnType<typeof createConfig>}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <HeroUIProvider>
            <ToastProvider>{children}</ToastProvider>
          </HeroUIProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
