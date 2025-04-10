interface EthereumEvent {
    (chainId: string): void;
}

interface Ethereum {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (eventName: "chainChanged", callback: EthereumEvent) => void;
    removeListener: (eventName: "chainChanged", callback: EthereumEvent) => void;
}

interface Window {
    ethereum: Ethereum;
}
