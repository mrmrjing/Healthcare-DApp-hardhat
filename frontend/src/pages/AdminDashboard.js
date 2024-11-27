import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getProviderRegistryEvents,
  verifyProvider,
  rejectProvider,
  isProviderVerified,
  isProviderRejected,
} from "../services/blockchain/contractService";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [registeredProviders, setRegisteredProviders] = useState([]);

  useEffect(() => {
    const resetStateAndFetch = async () => {
      // Clear persistent data
      localStorage.clear();
      sessionStorage.clear();
  
      // Clear the state
      setRegisteredProviders([]);
      setLogs([]);
  
      // Optionally log this reset operation
      addLogOnce("Resetting application state.");
  
      // Fetch fresh data if necessary
      await fetchRegisteredProviders();
    };
  
    resetStateAndFetch();
  },);
  
  
  const fetchRegisteredProviders = async () => {
    try {
      // Fetch registered providers from blockchain
      const providersFromEvents = await getProviderRegistryEvents();
      console.log("Fetched providers from blockchain:", providersFromEvents);
  
      if (providersFromEvents.length === 0) {
        console.log("No providers found. State is empty.");
        if (registeredProviders.length > 0) {
          setRegisteredProviders([]); // Reset state to an empty array
          addLogOnce("No registered providers found.");
        }
        return;
      }
  
      // Fetch status (isVerified and isRejected) for each provider
      const providersWithStatus = await Promise.all(
        providersFromEvents.map(async (provider) => {
          const isVerified = await isProviderVerified(provider.address);
          const isRejected = await isProviderRejected(provider.address); // Fetch isRejected from contract
          let status;
  
          // Determine the provider's status
          if (isRejected) {
            status = "Rejected";
          } else if (isVerified) {
            status = "Verified";
          } else {
            status = "Not Verified";
          }
  
          return { ...provider, isVerified, isRejected, status };
        })
      );
  
      // Update state only if there are changes
      const hasChanged =
        JSON.stringify(providersWithStatus) !== JSON.stringify(registeredProviders);
  
      if (hasChanged) {
        setRegisteredProviders(providersWithStatus);
        addLogOnce("Fetched registered providers successfully.");
      } else {
        addLogOnce("No changes detected in registered providers.");
      }
    } catch (error) {
      console.error("Error fetching registered providers:", error);
      addLogOnce("Error fetching registered providers.");
    }
  };
  
  const addLogOnce = (message) => {
    const timestampedMessage = `[${new Date().toLocaleString()}] ${message}`;
    if (!logs.includes(timestampedMessage)) {
      setLogs((prevLogs) => [...prevLogs, timestampedMessage]);
    }
  };
  
  const handleVerifyProvider = async (address) => {
    try {
      console.log(`Attempting to verify provider at address: ${address}`);
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
      console.log(`Attempting to reject provider at address: ${address}`);
      const success = await rejectProvider(address);
  
      if (success) {
        addLog(`Provider ${address} rejected successfully.`);
        await fetchRegisteredProviders(); // Refresh the provider list
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
                  {provider.status === "Rejected" ? (
                    <span className="admin-dashboard-rejected">Rejected</span>
                  ) : provider.status === "Verified" ? (
                    <span className="admin-dashboard-verified">Verified</span>
                  ) : (
                    <span className="admin-dashboard-not-verified">Not Verified</span>
                  )}
                </p>
                {provider.status === "Not Verified" && (
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
