import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, polygon, base, optimism, sepolia } from '@reown/appkit/networks';

// 1. Get projectId strictly from environment variables (.env)
const rawProjectId = import.meta.env.VITE_REOWN_PROJECT_ID || '';
export const projectId = String(rawProjectId).replace(/[\uFEFF\r\n\t "']/g, '').trim();

if (!projectId) {
  console.warn('⚠️ Variable VITE_REOWN_PROJECT_ID no configurada en el archivo .env');
}

// 2. Metadata configuration for NexCoin
const metadata = {
  name: 'NexCoin',
  description: 'NexCoin - Plataforma de Comercio Descentralizado On-Chain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nexcoin.crypto',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// 3. Define supported EVM networks
export const networks = [mainnet, polygon, arbitrum, base, optimism, sepolia] as const;

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [mainnet, polygon, arbitrum, base, optimism, sepolia]
});

// 5. Initialize Reown AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, polygon, arbitrum, base, optimism, sepolia],
  projectId,
  metadata,
  features: {
    analytics: false // Disabled to avoid ERR_BLOCKED_BY_CLIENT with browser adblockers
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#f59e0b',
    '--w3m-border-radius-master': '14px',
    '--w3m-color-mix': '#060911',
    '--w3m-color-mix-strength': 20
  }
});
