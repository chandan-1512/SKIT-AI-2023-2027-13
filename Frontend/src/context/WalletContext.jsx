/**
 * WalletContext.jsx — Application-wide MetaMask / ethers.js v6 wallet state.
 *
 * Provides: WalletProvider (wrap the app), useWallet() hook (consume anywhere).
 *
 * Responsibilities:
 *   - Detect whether MetaMask (window.ethereum) is available
 *   - Connect / disconnect wallet
 *   - Expose connected address (raw + truncated), current chainId, and a
 *     BrowserProvider instance ready for signing
 *   - Warn / block when not on the expected network (Sepolia = 11155111,
 *     or local Hardhat = 31337 for dev)
 *   - React to MetaMask's accountsChanged and chainChanged events
 *
 * Sprint 4 — Task 1: Wallet Integration
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
import { BrowserProvider } from 'ethers';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Chain IDs that the dApp accepts without blocking the user. */
export const ALLOWED_CHAIN_IDS = new Set([
  11155111, // Sepolia testnet
  31337,    // Local Hardhat node
]);

/** Human-readable network names for display. */
export const NETWORK_NAMES = {
  1:        'Ethereum Mainnet',
  11155111: 'Sepolia',
  31337:    'Hardhat (local)',
};

/** Hex chain ID for Sepolia — used when prompting MetaMask to switch. */
const SEPOLIA_HEX = '0xaa36a7';

// ─── Context definition ───────────────────────────────────────────────────────

/**
 * @typedef {{
 *   isMetaMaskAvailable: boolean,
 *   isConnected: boolean,
 *   isCorrectNetwork: boolean,
 *   isConnecting: boolean,
 *   address: string | null,
 *   addressShort: string | null,
 *   chainId: number | null,
 *   networkName: string | null,
 *   provider: import('ethers').BrowserProvider | null,
 *   connect: () => Promise<void>,
 *   disconnect: () => void,
 *   switchToSepolia: () => Promise<void>,
 * }} WalletContextValue
 */

const WalletContext = createContext(/** @type {WalletContextValue | null} */ (null));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shorten a full hex address to "0x1234…abcd" */
function shortenAddress(addr) {
  if (!addr) return null;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Returns window.ethereum if MetaMask is available, otherwise null. */
function getEthereum() {
  if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
    return window.ethereum;
  }
  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * WalletProvider — wrap your root component (inside AuthProvider is fine).
 *
 * @param {{ children: React.ReactNode }} props
 */
export function WalletProvider({ children }) {
  const [address, setAddress]         = useState(/** @type {string|null} */ (null));
  const [chainId, setChainId]         = useState(/** @type {number|null} */ (null));
  const [isConnecting, setConnecting] = useState(false);

  // Keep a stable ref to the provider so event handlers can access it without
  // triggering re-renders.
  const providerRef = useRef(/** @type {import('ethers').BrowserProvider|null} */ (null));

  const isMetaMaskAvailable = Boolean(getEthereum());
  const isConnected         = Boolean(address);
  const isCorrectNetwork    = chainId !== null && ALLOWED_CHAIN_IDS.has(chainId);
  const networkName         = chainId ? (NETWORK_NAMES[chainId] ?? `Chain ${chainId}`) : null;

  // ── Internal helpers ────────────────────────────────────────────────────────

  /** Refresh address & chainId from the provider. */
  const refreshState = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;

    try {
      const provider = new BrowserProvider(eth);
      providerRef.current = provider;

      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0].address);
      } else {
        setAddress(null);
      }

      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
    } catch {
      // If the user locks MetaMask mid-session, gracefully clear state.
      setAddress(null);
      setChainId(null);
      providerRef.current = null;
    }
  }, []);

  // ── Event listeners ─────────────────────────────────────────────────────────

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    /** accountsChanged fires when the user switches accounts or disconnects. */
    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        // User disconnected all accounts
        setAddress(null);
        setChainId(null);
        providerRef.current = null;
      } else {
        setAddress(accounts[0]);
        // Refresh the provider reference with the new account context
        providerRef.current = new BrowserProvider(eth);
      }
    }

    /** chainChanged fires when the user switches networks. */
    function handleChainChanged(hexChainId) {
      setChainId(parseInt(hexChainId, 16));
      // Re-create the provider since it's bound to the old chain
      providerRef.current = new BrowserProvider(eth);
    }

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    // Check if MetaMask is already connected (e.g. page refresh)
    refreshState();

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
    };
  }, [refreshState]);

  // ── Public actions ──────────────────────────────────────────────────────────

  /**
   * Prompt MetaMask's connection flow.
   * On success, address & chainId are populated via the accountsChanged event.
   */
  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      const provider = new BrowserProvider(eth);
      providerRef.current = provider;

      // eth_requestAccounts triggers the MetaMask popup
      await provider.send('eth_requestAccounts', []);
      await refreshState();
    } catch (err) {
      // 4001 = user rejected; anything else is a real error
      if (err?.code !== 4001) {
        console.error('[WalletContext] connect error:', err);
      }
    } finally {
      setConnecting(false);
    }
  }, [refreshState]);

  /** Soft-disconnect — clears app state (MetaMask itself stays connected). */
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    providerRef.current = null;
  }, []);

  /**
   * Ask MetaMask to switch to Sepolia.
   * If the network isn't in MetaMask's list yet, prompt the user to add it.
   */
  const switchToSepolia = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX }],
      });
    } catch (switchError) {
      // 4902 = chain not added yet → add it
      if (switchError?.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_HEX,
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('[WalletContext] wallet_addEthereumChain error:', addError);
        }
      }
    }
  }, []);

  // ── Context value ────────────────────────────────────────────────────────────

  const value = {
    isMetaMaskAvailable,
    isConnected,
    isCorrectNetwork,
    isConnecting,
    address,
    addressShort: shortenAddress(address),
    chainId,
    networkName,
    /** Live BrowserProvider instance — use for read-only calls. */
    provider: providerRef.current,
    connect,
    disconnect,
    switchToSepolia,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useWallet — consume wallet context anywhere inside WalletProvider.
 *
 * @returns {WalletContextValue}
 */
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error(
      'useWallet must be used inside <WalletProvider>. Check your component tree.',
    );
  }
  return ctx;
}
