import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  verifyProvider,
  isProviderRegistered,
  isProviderVerified,
  getAllProviders,
  listenForProviderRegistered,
  removeProviderRegisteredListener,
} from "../services/blockchain/contractService";
import "../styles/AdminDashboard.css";
import { AuthContext } from "../contexts/AuthContext";

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext); // Use the logout function from AuthContext
  const navigate = useNavigate();
  const [providerAddress, setProviderAddress] = useState("");
  const [logs, setLogs] = useState([]);
  const [registeredProviders, setRegisteredProviders] = useState([]); // Fetched providers
  const [newProviders, setNewProviders] = useState([]); // Newly registered providers from events

  useEffect(() => {
    // Set up the event listener for ProviderRegistered events
    listenForProviderRegistered((providerAddress, dataCID) => {
      addLog(`New provider registered: ${providerAddress} with CID: ${dataCID}`);
      setNewProviders((prev) => [
        ...prev,
        { address: providerAddress, dataCID, isVerified: false },
      ]);
    });

    // Cleanup the event listener when the component unmounts
    return () => {
      removeProviderRegisteredListener(); // Remove all listeners via contractService
    };
  }, []);

  const handleVerifyProvider = async () => {
    if (!providerAddress) {
      alert("Please enter a valid provider address.");
      return;
    }

    const isRegistered = await isProviderRegistered(providerAddress);
    if (!isRegistered) {
      alert("The provider is not registered. Please check the address.");
      addLog(`Failed to verify: ${providerAddress} is not registered.`);
      return;
    }

    const isVerified = await isProviderVerified(providerAddress);
    if (isVerified) {
      alert("This provider is already verified.");
      addLog(`Provider ${providerAddress} is already verified.`);
      return;
    }

    try {
      await verifyProvider(providerAddress);
      alert(`Provider ${providerAddress} verified successfully.`);
      addLog(`Verified provider: ${providerAddress}`);
      setNewProviders((prev) =>
        prev.map((provider) =>
          provider.address === providerAddress ? { ...provider, isVerified: true } : provider
        )
      );
    } catch (error) {
      alert(`Failed to verify provider: ${providerAddress}`);
      addLog(`Failed to verify provider: ${providerAddress}`);
    }
    setProviderAddress("");
  };

  const fetchRegisteredProviders = async () => {
    try {
      const providers = await getAllProviders();
      if (providers.length === 0) {
        alert("No providers found.");
        return;
      }

      const formattedProviders = await Promise.all(
        providers.map(async (providerAddress) => ({
          address: providerAddress,
          isVerified: await isProviderVerified(providerAddress),
        }))
      );
      setRegisteredProviders(formattedProviders);
      addLog("Fetched registered providers.");
    } catch (error) {
      console.error("Error fetching registered providers:", error);
      alert("Failed to fetch registered providers. Check the console for details.");
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleString();
    setLogs((prevLogs) => [...prevLogs, `[${timestamp}] ${message}`]);
  };

  const handleLogout = () => {
    logout(); // Call the logout function from AuthContext
    localStorage.removeItem("walletAddress"); // Remove the wallet address from local storage
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

      {/* Verify Provider Section */}
      <section className="admin-dashboard-section">
        <h2>Verify Provider</h2>
        <input
          type="text"
          placeholder="Enter provider address"
          value={providerAddress}
          onChange={(e) => setProviderAddress(e.target.value)}
          className="admin-dashboard-input"
        />
        <button onClick={handleVerifyProvider} className="admin-dashboard-button">
          Verify Provider
        </button>
      </section>

      {/* New Registered Providers Section */}
      <section className="admin-dashboard-section">
        <h2>Newly Registered Providers</h2>
        {newProviders.length > 0 ? (
          <ul className="admin-dashboard-list">
            {newProviders.map((provider, index) => (
              <li key={index} className="admin-dashboard-list-item">
                Address: {provider.address}, CID: {provider.dataCID} -{" "}
                {provider.isVerified ? (
                  <span className="admin-dashboard-verified">Verified</span>
                ) : (
                  <button
                    onClick={() => {
                      setProviderAddress(provider.address);
                      handleVerifyProvider();
                    }}
                    className="admin-dashboard-button"
                  >
                    Verify
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No new providers registered yet.</p>
        )}
      </section>

      {/* Registered Providers Section */}
      <section className="admin-dashboard-section">
        <h2>Registered Providers</h2>
        <button onClick={fetchRegisteredProviders} className="admin-dashboard-button">
          Fetch Registered Providers
        </button>
        {registeredProviders.length > 0 ? (
          <ul className="admin-dashboard-list">
            {registeredProviders.map((provider, index) => (
              <li key={index} className="admin-dashboard-list-item">
                Address: {provider.address} -{" "}
                {provider.isVerified ? (
                  <span className="admin-dashboard-verified">Verified</span>
                ) : (
                  <span className="admin-dashboard-not-verified">Not Verified</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No providers fetched yet.</p>
        )}
      </section>

      {/* Logs Section */}
      <section className="admin-dashboard-section">
        <h2>Logs</h2>
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
