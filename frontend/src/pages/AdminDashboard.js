import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getProviderRegistryEvents,
  verifyProvider,
  rejectProvider,
  isProviderVerified,
} from "../services/blockchain/contractService";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [registeredProviders, setRegisteredProviders] = useState([]);

  // Fetch providers and verification status when the component mounts
  useEffect(() => {
    fetchRegisteredProviders();
  },);

  const fetchRegisteredProviders = async () => {
    try {
      // Fetch registered providers from event logs
      const providersFromEvents = await getProviderRegistryEvents();
  
      // If no providers are found
      if (providersFromEvents.length === 0) {
        if (registeredProviders.length === 0) {
          // Log only once if no providers exist
          if (!logs.some((log) => log.includes("No registered providers found."))) {
            addLog("No registered providers found.");
          }
        }
        return;
      }
  
      // Fetch verification and rejection status for each provider
      const providersWithStatus = await Promise.all(
        providersFromEvents.map(async (provider) => {
          const isVerified = await isProviderVerified(provider.address);
          return { ...provider, isVerified };
        })
      );
  
      // Check if the list has changed before updating state
      if (
        JSON.stringify(providersWithStatus) !== JSON.stringify(registeredProviders)
      ) {
        setRegisteredProviders(providersWithStatus);
        addLog("Fetched registered providers successfully.");
      } else {
        // Log "No new providers found" only once
        if (!logs.some((log) => log.includes("No new providers found."))) {
          addLog("No new providers found.");
        }
      }
    } catch (error) {
      console.error("Error fetching registered providers:", error);
      addLog("Error fetching registered providers.");
    }
  };
  
  
  

  const handleVerifyProvider = async (address) => {
    try {
      const success = await verifyProvider(address);
      if (success) {
        addLog(`Provider ${address} verified successfully.`);
        fetchRegisteredProviders(); // Refresh the provider list
        alert(`Provider ${address} has been verified.`);
      } else {
        addLog(`Failed to verify provider: ${address}.`);
        alert(`Failed to verify provider: ${address}.`);
      }
    } catch (error) {
      console.error("Error verifying provider:", error);
      addLog(`Error verifying provider: ${address}.`);
      alert("An error occurred while verifying the provider.");
    }
  };

  const handleRejectProvider = async (address) => {
    try {
      const success = await rejectProvider(address);
      if (success) {
        addLog(`Provider ${address} rejected successfully.`);
        fetchRegisteredProviders(); // Refresh the provider list
        alert(`Provider ${address} has been rejected.`);
      } else {
        addLog(`Failed to reject provider: ${address}.`);
        alert(`Failed to reject provider: ${address}.`);
      }
    } catch (error) {
      console.error("Error rejecting provider:", error);
      addLog(`Error rejecting provider: ${address}.`);
      alert("An error occurred while rejecting the provider.");
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleString();
    setLogs((prevLogs) => [...prevLogs, `[${timestamp}] ${message}`]);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("walletAddress");
    navigate("/");
  };

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      {/* Registered Providers Section */}
      <section className="admin-dashboard-section">
        <h2>Registered Healthcare Providers</h2>
        <button onClick={fetchRegisteredProviders} className="admin-dashboard-button">
          Refresh Providers
        </button>
        {registeredProviders.length > 0 ? (
          <ul className="admin-dashboard-list">
            {registeredProviders.map((provider, index) => (
              <li key={index} className="admin-dashboard-list-item">
                <p>
                  <strong>Address:</strong> {provider.address} <br />
                  <strong>CID:</strong> {provider.dataCID} <br />
                  <strong>Status:</strong>{" "}
                  {provider.isVerified ? (
                    <span className="admin-dashboard-verified">Verified</span>
                  ) : (
                    <span className="admin-dashboard-not-verified">Not Verified</span>
                  )}
                </p>
                {!provider.isVerified && (
                  <div className="admin-dashboard-actions">
                    <button
                      onClick={() => handleVerifyProvider(provider.address)}
                      className="admin-dashboard-button"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleRejectProvider(provider.address)}
                      className="admin-dashboard-button reject-button"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No registered providers found.</p>
        )}
      </section>

      {/* Logs Section */}
      <section className="admin-dashboard-section">
        <h2>Activity Logs</h2>
        <ul className="admin-dashboard-log-list">
          {logs.map((log, index) => (
            <li key={index} className="admin-dashboard-log-item">
              {log}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;
