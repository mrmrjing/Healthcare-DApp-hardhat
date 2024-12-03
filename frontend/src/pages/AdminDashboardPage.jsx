import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getProviderRegistryEvents,
  verifyProvider,
  rejectProvider,
  isProviderVerified,
  isProviderRejected,
} from "../services/contractService";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [registeredProviders, setRegisteredProviders] = useState([]);

  // Fetch registered providers when the component mounts
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.info("[INFO] Initializing dashboard and resetting state...");
        resetState();
        await fetchRegisteredProviders();
      } catch (error) {
        console.error("[ERROR] Failed to initialize dashboard:", error);
        addLog("Failed to initialize dashboard.");
      }
    };

    initializeDashboard();
  }, []);

  /**
   * Resets local state and clears browser storage.
   */
  const resetState = () => {
    console.info("[INFO] Resetting application state...");
    localStorage.clear();
    sessionStorage.clear();
    setRegisteredProviders([]);
    setLogs([]);
  };

  /**
   * Fetches registered healthcare providers and their statuses.
   */
  const fetchRegisteredProviders = async () => {
    try {
      console.info("[INFO] Fetching registered providers...");

      // Fetch provider events from the blockchain
      const providersFromEvents = await getProviderRegistryEvents();
      console.debug("[DEBUG] Providers fetched from events:", providersFromEvents);

      if (providersFromEvents.length === 0) {
        console.warn("[WARN] No providers found.");
        setRegisteredProviders([]);
        addLog("No registered providers found.");
        return;
      }

      // Fetch verification and rejection status for each provider
      const providersWithStatus = await Promise.all(
        providersFromEvents.map(async (provider) => {
          const isVerified = await isProviderVerified(provider.address);
          const isRejected = await isProviderRejected(provider.address);
          const status = isVerified
            ? "Verified"
            : isRejected
            ? "Rejected"
            : "Not Verified";

          return { ...provider, status };
        })
      );

      // Update state only if there are changes
      const hasChanges =
        JSON.stringify(providersWithStatus) !== JSON.stringify(registeredProviders);

      if (hasChanges) {
        setRegisteredProviders(providersWithStatus);
        addLog("Registered providers fetched successfully.");
      } else {
        addLog("No changes detected in registered providers.");
      }
    } catch (error) {
      console.error("[ERROR] Error fetching registered providers:", error);
      addLog("Error fetching registered providers.");
    }
  };

  /**
   * Adds a log entry with a timestamp.
   * @param {string} message - The log message.
   */
  const addLog = (message) => {
    const timestamp = new Date().toLocaleString();
    setLogs((prevLogs) => [...prevLogs, `[${timestamp}] ${message}`]);
  };

  /**
   * Verifies a provider.
   * @param {string} address - The address of the provider.
   */
  const handleVerifyProvider = async (address) => {
    try {
      console.info(`[INFO] Verifying provider with address: ${address}`);
      const success = await verifyProvider(address);

      if (success) {
        addLog(`Provider ${address} verified successfully.`);
        await fetchRegisteredProviders(); // Refresh the provider list
        alert(`Provider ${address} has been verified.`);
      } else {
        console.warn(`[WARN] Verification failed for provider: ${address}`);
        addLog(`Failed to verify provider: ${address}.`);
        alert(`Failed to verify provider: ${address}.`);
      }
    } catch (error) {
      console.error("[ERROR] Error verifying provider:", error);
      addLog(`Error verifying provider: ${address}.`);
      alert("An error occurred while verifying the provider.");
    }
  };

  /**
   * Rejects a provider.
   * @param {string} address - The address of the provider.
   */
  const handleRejectProvider = async (address) => {
    try {
      console.info(`[INFO] Rejecting provider with address: ${address}`);
      const success = await rejectProvider(address);

      if (success) {
        addLog(`Provider ${address} rejected successfully.`);
        await fetchRegisteredProviders(); // Refresh the provider list
        alert(`Provider ${address} has been rejected.`);
      } else {
        console.warn(`[WARN] Rejection failed for provider: ${address}`);
        addLog(`Failed to reject provider: ${address}.`);
        alert(`Failed to reject provider: ${address}.`);
      }
    } catch (error) {
      console.error("[ERROR] Error rejecting provider:", error);
      addLog(`Error rejecting provider: ${address}.`);
      alert("An error occurred while rejecting the provider.");
    }
  };

  /**
   * Logs out the admin and navigates to the home page.
   */
  const handleLogout = () => {
    console.info("[INFO] Logging out...");
    logout();
    localStorage.removeItem("walletAddress");
    navigate("/");
  };

  return (
    <div className="admin-dashboard-container">
      {/* Header Section */}
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
                  <strong>CID:</strong> {provider.dataCID || "N/A"} <br />
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
