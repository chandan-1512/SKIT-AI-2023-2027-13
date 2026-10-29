/**
 * WalletConnect.jsx — MetaMask connection UI for the Navbar.
 *
 * States handled:
 *   1. MetaMask not installed → "Install MetaMask" link
 *   2. Not connected           → "Connect Wallet" button
 *   3. Connecting              → loading spinner
 *   4. Connected, wrong network → address + "Switch to Sepolia" warning badge
 *   5. Connected, correct network → address + network badge + disconnect menu
 *
 * Sprint 4 — Task 1: Wallet Integration
 */

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';

// ─── Network status badge ─────────────────────────────────────────────────────

function NetworkBadge({ isCorrectNetwork, networkName }) {
  if (!networkName) return null;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
        isCorrectNetwork
          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
          : 'bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse',
      ].join(' ')}
    >
      <span
        className={[
          'w-1.5 h-1.5 rounded-full',
          isCorrectNetwork ? 'bg-green-400' : 'bg-red-400',
        ].join(' ')}
      />
      {networkName}
    </span>
  );
}

// ─── Dropdown menu (connected state) ─────────────────────────────────────────

function WalletDropdown({ address, addressShort, networkName, isCorrectNetwork, onDisconnect, onSwitch }) {
  return (
    <div
      className={[
        'absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface-elevated)] shadow-2xl animate-slide-up z-50 overflow-hidden',
      ].join(' ')}
      role="menu"
      aria-label="Wallet menu"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          Connected wallet
        </p>
        <p className="font-mono text-sm text-[var(--color-text-primary)] truncate">
          {address}
        </p>
      </div>

      {/* Network row */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">Network</span>
        <NetworkBadge isCorrectNetwork={isCorrectNetwork} networkName={networkName} />
      </div>

      {/* Wrong network warning + switch action */}
      {!isCorrectNetwork && (
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-red-500/5">
          <p className="text-xs text-red-400 mb-2 leading-snug">
            ⚠️ Please switch to Sepolia testnet to use this app.
          </p>
          <button
            id="wallet-switch-network-btn"
            onClick={onSwitch}
            className={[
              'w-full text-xs font-semibold py-1.5 px-3 rounded-lg',
              'bg-red-500/20 text-red-400 border border-red-500/30',
              'hover:bg-red-500/30 transition-colors duration-150',
            ].join(' ')}
          >
            Switch to Sepolia
          </button>
        </div>
      )}

      {/* Disconnect */}
      <button
        id="wallet-disconnect-btn"
        role="menuitem"
        onClick={onDisconnect}
        className={[
          'w-full text-left px-4 py-3 text-sm text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]',
          'transition-colors duration-150 flex items-center gap-2',
        ].join(' ')}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Disconnect wallet
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * WalletConnect — drop-in replacement for the Sprint 1 placeholder button.
 * Renders a single button whose appearance and behavior depends on wallet state.
 */
export default function WalletConnect() {
  const {
    isMetaMaskAvailable,
    isConnected,
    isCorrectNetwork,
    isConnecting,
    address,
    addressShort,
    networkName,
    connect,
    disconnect,
    switchToSepolia,
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── 1. MetaMask not installed ──────────────────────────────────────────────
  if (!isMetaMaskAvailable) {
    return (
      <a
        id="install-metamask-btn"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className={[
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold',
          'border border-amber-500/40 text-amber-400 bg-amber-500/10',
          'hover:bg-amber-500/20 transition-colors duration-150',
        ].join(' ')}
        title="MetaMask is required"
      >
        <MetaMaskIcon />
        Install MetaMask
      </a>
    );
  }

  // ── 2. Not connected / connecting ──────────────────────────────────────────
  if (!isConnected) {
    return (
      <button
        id="wallet-connect-btn"
        onClick={connect}
        disabled={isConnecting}
        className={[
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold',
          'border border-[var(--color-accent)] text-[var(--color-accent)]',
          'bg-[var(--color-accent-muted)]',
          isConnecting
            ? 'opacity-60 cursor-not-allowed'
            : 'hover:bg-[var(--color-accent)] hover:text-white transition-all duration-200 active:scale-95',
        ].join(' ')}
      >
        {isConnecting ? (
          <>
            <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Connecting…
          </>
        ) : (
          <>
            <WalletIcon />
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  // ── 3. Connected ───────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      <button
        id="wallet-address-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={[
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold',
          'border transition-all duration-200 active:scale-95',
          isCorrectNetwork
            ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-muted)] hover:bg-[var(--color-accent)] hover:text-white'
            : 'border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20',
        ].join(' ')}
      >
        {/* Status dot */}
        <span
          className={[
            'w-1.5 h-1.5 rounded-full',
            isCorrectNetwork ? 'bg-green-400' : 'bg-red-400 animate-pulse',
          ].join(' ')}
        />

        {/* Truncated address */}
        <span className="font-mono">{addressShort}</span>

        {/* Network badge (inline, small) */}
        {networkName && (
          <span
            className={[
              'px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider',
              isCorrectNetwork
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300',
            ].join(' ')}
          >
            {networkName}
          </span>
        )}

        {/* Chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={['transition-transform duration-200', isOpen ? 'rotate-180' : ''].join(' ')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <WalletDropdown
          address={address}
          addressShort={addressShort}
          networkName={networkName}
          isCorrectNetwork={isCorrectNetwork}
          onDisconnect={() => { disconnect(); setIsOpen(false); }}
          onSwitch={() => { switchToSepolia(); setIsOpen(false); }}
        />
      )}
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function WalletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12h2" />
    </svg>
  );
}

function MetaMaskIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
