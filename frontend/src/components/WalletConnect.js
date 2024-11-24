import React, { useState, useEffect } from 'react';

const WalletConnect = ({ onLogout }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState('');

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => typeof window.ethereum !== 'undefined';

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!isMetaMaskInstalled()) {
        setError('MetaMask is not installed. Please install it to continue.');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0]; // Get the first selected account
      setWalletAddress(address); // Update state
      localStorage.setItem('walletAddress', address); // Persist to local storage
      setError('');
    } catch (err) {
      console.error('Error connecting wallet:', err);
      if (err.code === 4001) {
        setError('Connection request rejected by user.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    }
  };

  // Disconnect wallet (logs out the user)
  const disconnectWallet = () => {
    setWalletAddress(null); // Clear wallet address from state
    localStorage.removeItem('walletAddress'); // Remove wallet from local storage
    setError('');
    if (onLogout) onLogout(); // Trigger additional logout logic if provided
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // Wallet disconnected
          disconnectWallet();
        } else {
          // Wallet switched
          const address = accounts[0];
          setWalletAddress(address);
          localStorage.setItem('walletAddress', address); // Update local storage
        }
      });
    }

    // Restore wallet connection on page load
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
  }, []);

  return (
    <div className="wallet-connect">
      <h2>Wallet Connection</h2>
      {walletAddress ? (
        <div>
          <p>
            Connected as: <span className="wallet-address">{walletAddress}</span>
          </p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default WalletConnect;
