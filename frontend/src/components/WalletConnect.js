import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import {
  isPatientRegistered,
  isProviderRegistered,
  isProviderVerified,
} from "../services/blockchain/contractService";

const WalletConnect = () => {
  const { authState, setAuthState } = useContext(AuthContext);
  const [roleMessage, setRoleMessage] = useState(""); // State to store feedback message

  // Connect wallet and determine user role
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Clear any existing app state
        clearAppState();

        // Request wallet connection
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const userAddress = accounts[0];
        const userRole = await fetchUserRole(userAddress);

        // Handle different roles
        if (userRole === "doctor") {
          setAuthState({
            isAuthenticated: true,
            userRole: "doctor",
            userAddress,
          });
          alert("You are connected as a doctor.");
          window.location.href = "/doctor/dashboard";
        } else if (userRole === "patient") {
          setAuthState({
            isAuthenticated: true,
            userRole: "patient",
            userAddress,
          });
          alert("You are connected as a patient.");
          window.location.href = "/patient/dashboard";
        } else if (userRole === "unverified") {
          alert("Provider is registered but not verified. Please contact the admin for verification.");
        } else {
          setRoleMessage("User is not registered as a provider or patient.");
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet. Please try again.");
      }
    } else {
      alert("MetaMask not detected. Please install MetaMask.");
    }
  };

  // Fetch user role based on wallet address
  const fetchUserRole = async (address) => {
    try {
      const isRegisteredProvider = await isProviderRegistered(address);
      if (isRegisteredProvider) {
        const isVerifiedProvider = await isProviderVerified(address);
        return isVerifiedProvider ? "doctor" : "unverified";
      }

      const isRegisteredPatient = await isPatientRegistered(address);
      if (isRegisteredPatient) {
        return "patient";
      }

      return null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  // Clear app state when resetting or switching wallets
  const clearAppState = () => {
    localStorage.clear();
    sessionStorage.clear();
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      userAddress: null,
    });
    setRoleMessage("");
  };

  // Handle MetaMask account or network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountChange = (accounts) => {
        if (accounts.length === 0) {
          console.log("MetaMask disconnected. Clearing app state...");
          clearAppState();
        } else {
          console.log("Account changed. Reloading...");
          clearAppState();
          connectWallet(); // Reconnect with the new account
        }
      };

      const handleNetworkChange = () => {
        console.log("Network changed. Clearing app state...");
        clearAppState();
      };

      window.ethereum.on("accountsChanged", handleAccountChange);
      window.ethereum.on("chainChanged", handleNetworkChange);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountChange);
        window.ethereum.removeListener("chainChanged", handleNetworkChange);
      };
    }
  },);

  return (
    <div>
      {!authState.isAuthenticated ? (
        <div>
          <button onClick={connectWallet}>Connect Wallet</button>
          {roleMessage && <p>{roleMessage}</p>} {/* Display feedback message */}
        </div>
      ) : (
        <p>Wallet Connected: {authState.userAddress}</p>
      )}
    </div>
  );
};

export default WalletConnect;
