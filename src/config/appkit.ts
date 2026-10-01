import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, polygon, base, optimism, sepolia } from '@reown/appkit/networks';

// 1. Get projectId strictly from environment variables (.env)
const rawProjectId = import.meta.env.VITE_REOWN_PROJECT_ID || '';
export const projectId = String(rawProjectId).replace(/[\uFEFF\r\n\t "']/g, '').trim();

if (!projectId) {
  console.warn('⚠️ Variable VITE_REOWN_PROJECT_ID no configurada en el archivo .env');
}

// 2. Metadata configuration for NovaSats
const metadata = {
  name: 'NovaSats',
  description: 'NovaSats - Plataforma de Comercio Descentralizado On-Chain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://novasats.vercel.app',
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
  enableCoinbase: false, // Disables standalone Coinbase SDK telemetry (cca-lite.coinbase.com)
  enableBaseAccount: false,
  enableInjected: true,
  enableWalletConnect: true,
  features: {
    analytics: false, // Disabled to prevent pulse.walletconnect.org ERR_BLOCKED_BY_CLIENT
    email: false,
    socials: []
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#f59e0b',
    '--w3m-border-radius-master': '14px',
    '--w3m-color-mix': '#060911',
    '--w3m-color-mix-strength': 20
  }
});

// Suppress unhandled telemetry rejections from ad-blockers / Brave shields
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const str = String(event.reason?.message || event.reason || '');
    if (
      str.includes('Failed to fetch') ||
      str.includes('ERR_BLOCKED_BY_CLIENT') ||
      event.reason?.context === 'AnalyticsSDKApiError'
    ) {
      event.preventDefault();
    }
  });
}
