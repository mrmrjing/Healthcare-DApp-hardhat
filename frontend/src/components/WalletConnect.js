import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { isPatientRegistered, isProviderRegistered, isProviderVerified } from "../services/blockchain/contractService";

const WalletConnect = () => {
  const { authState, setAuthState } = useContext(AuthContext);
  const [roleMessage, setRoleMessage] = useState(""); // State to store feedback message

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const userAddress = accounts[0];
        const userRole = await fetchUserRole(userAddress);
  
        if (userRole) {
          // Update authentication state
          setAuthState({
            isAuthenticated: true,
            userRole,
            userAddress,
          });
  
          // Show an alert message for role confirmation
          alert(`You are connected as a ${userRole}.`);
  
          // Redirect to the dashboard after confirmation
          if (userRole === "doctor") {
            window.location.href = "/doctor/dashboard";
          } else if (userRole === "patient") {
            window.location.href = "/patient/dashboard";
          }
        } else {
          alert("No role found. Please register.");
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet. Please try again.");
      }
    } else {
      alert("MetaMask not detected. Please install MetaMask.");
    }
  };
  

  const fetchUserRole = async (address) => {
    try {
      console.log("Checking if the address is a registered provider...");
      const isRegisteredProvider = await isProviderRegistered(address);
      if (isRegisteredProvider) {
        console.log("Address is a registered provider. Checking verification status...");
        const isVerifiedProvider = await isProviderVerified(address);
        if (isVerifiedProvider) {
          console.log("Provider is verified.");
          return "doctor";
        } else {
          console.warn("Provider is registered but not verified.");
          return null;
        }
      }

      console.log("Checking if the address is a registered patient...");
      const isRegisteredPatient = await isPatientRegistered(address);
      if (isRegisteredPatient) {
        console.log("Address is a registered patient.");
        return "patient";
      }

      console.warn("Address is neither a registered provider nor a patient.");
      return null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

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
