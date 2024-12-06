import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  isPatientRegistered,
  isProviderRegistered,
  isProviderVerified,
} from "../services/contractService";

const WalletConnect = () => {
  const { authState, setAuthState } = useContext(AuthContext);
  const [roleMessage, setRoleMessage] = useState("");
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install a MetaMask wallet to interact!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const userAddress = accounts[0];
        const userRole = await fetchUserRole(userAddress);

        if (userRole) {
          setAuthState({ isAuthenticated: true, userRole, userAddress });
          setRoleMessage(`Success! Wallet connected as ${userRole}. Redirecting...`);

          setTimeout(() => {
            navigate(userRole === "doctor" ? "/doctor/request-access" : "/patient/dashboard");
          }, 3000); // 3-second delay
        } else {
          setRoleMessage("Unrecognized wallet. Please register as a user.");
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setRoleMessage("Failed to connect wallet. Please try again.");
    }
  };

  const fetchUserRole = async (address) => {
    try {
      if (await isProviderRegistered(address)) {
        return (await isProviderVerified(address)) ? "doctor" : "unverified";
      }
      return (await isPatientRegistered(address)) ? "patient" : null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {!authState.isAuthenticated ? (
        <div>
          <button
            onClick={connectWallet}
            style={{
              padding: "15px 30px",
              fontSize: "1.1em",
              border: "none",
              borderRadius: "8px",
              background: "linear-gradient(to right, #66bb6a, #43a047)",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
            }}
          >
            Connect Wallet
          </button>
          {roleMessage && <p style={{ marginTop: "15px", color: "#555" }}>{roleMessage}</p>}
        </div>
      ) : (
        <p
          style={{
            fontSize: "1.2em",
            color: "#43a047",
            fontWeight: "bold",
            marginTop: "20px",
          }}
        >
          {roleMessage || `Wallet Connected: ${authState.userAddress}`}
        </p>
      )}
    </div>
  );
};

export default WalletConnect;
