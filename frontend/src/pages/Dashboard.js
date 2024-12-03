import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getProviderRegistryEvents,
  isAuthorized,
  grantAccessToProvider,
  revokeAccessFromProvider,
  getMyMedicalRecords,
} from "../services/blockchain/contractService";
import UploadMedicalRecord from "../components/Patient/UploadMedicalRecord";
import GrantAccessPage from "./GrantAccessPage";
import "../styles/PatientDashboard.css";

const PatientDashboard = () => {
  const { authState, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [accessLogs, setAccessLogs] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when the component mounts or authState changes
  useEffect(() => {
    const patientAddress = authState?.userAddress;

    if (patientAddress) {
      fetchDashboardData(patientAddress);
      fetchMedicalRecords(patientAddress);
    } else {
      console.warn("[WARN] Patient address is missing in authState.");
    }
  }, [authState?.userAddress]);

  /**
   * Fetch dashboard data, including access logs and permissions.
   * @param {string} patientAddress - The address of the patient.
   */
  const fetchDashboardData = async (patientAddress) => {
    try {
      console.info("[INFO] Fetching dashboard data for patient:", patientAddress);
      setLoading(true);

      const providerEvents = await getProviderRegistryEvents();
      console.debug("[DEBUG] Provider registry events:", providerEvents);

      const filteredEvents = await Promise.all(
        providerEvents.map(async (event) => {
          const hasAccess = await isAuthorized(patientAddress, event.address);
          return hasAccess ? event : null;
        })
      );

      const authorizedProviders = filteredEvents.filter(Boolean);

      // Prepare access logs and permissions
      setAccessLogs(
        authorizedProviders.map((event) => ({
          id: event.address,
          date: new Date().toLocaleDateString(),
          action: `Access granted to ${event.address}`,
        }))
      );

      setPermissions(
        authorizedProviders.map((event) => ({
          id: event.address,
          name: event.dataCID || "Unknown",
          type: "Provider",
          access: true,
        }))
      );
    } catch (err) {
      console.error("[ERROR] Failed to fetch dashboard data:", err);
      setError("Failed to fetch data from the blockchain.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch the patient's medical records.
   * @param {string} patientAddress - The address of the patient.
   */
  const fetchMedicalRecords = async (patientAddress) => {
    try {
      console.info("[INFO] Fetching medical records for patient:", patientAddress);

      const records = await getMyMedicalRecords(patientAddress);
      console.debug("[DEBUG] Medical records fetched:", records);

      setMedicalRecords(records || []);
    } catch (err) {
      console.error("[ERROR] Failed to fetch medical records:", err);
      setError("Failed to fetch medical records.");
    }
  };

  /**
   * Toggle permission for a provider (grant/revoke).
   * @param {string} providerAddress - The address of the provider.
   * @param {boolean} currentAccess - Current access status of the provider.
   */
  const togglePermission = async (providerAddress, currentAccess) => {
    try {
      console.info(
        `[INFO] ${currentAccess ? "Revoking" : "Granting"} access for provider:`,
        providerAddress
      );

      if (currentAccess) {
        await revokeAccessFromProvider(providerAddress);
      } else {
        await grantAccessToProvider(providerAddress);
      }

      // Update permissions state
      setPermissions((prevPermissions) =>
        prevPermissions.map((perm) =>
          perm.id === providerAddress ? { ...perm, access: !perm.access } : perm
        )
      );

      console.info(`[INFO] Access ${currentAccess ? "revoked" : "granted"} successfully.`);
    } catch (err) {
      console.error(
        `[ERROR] Failed to ${currentAccess ? "revoke" : "grant"} permission for provider:`,
        providerAddress,
        err
      );
      setError(`Failed to ${currentAccess ? "revoke" : "grant"} permission.`);
    }
  };

  /**
   * Log out the user and navigate to the home page.
   */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /**
   * Refresh the medical records list after a successful upload.
   */
  const handleUploadSuccess = () => {
    console.info("[INFO] Refreshing medical records after successful upload.");
    fetchMedicalRecords(authState?.userAddress);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="dashboard-container">
      <div className="logout-button">
        <button onClick={handleLogout}>Log Out</button>
      </div>

      <h1>Patient Dashboard</h1>

      {/* Medical Record Upload Section */}
      <section className="section">
        <UploadMedicalRecord
          patientAddress={authState?.userAddress}
          onUploadSuccess={handleUploadSuccess}
        />
      </section>

      {/* Medical Records List */}
      <section className="section">
        <h2>Your Medical Records</h2>
        <ul>
          {medicalRecords.length > 0 ? (
            medicalRecords.map((record, index) => (
              <li key={index}>
                <p>
                  <strong>CID:</strong> {record.CID}
                </p>
                <p>
                  <strong>Timestamp:</strong> {record.timestamp}
                </p>
              </li>
            ))
          ) : (
            <p>No medical records found.</p>
          )}
        </ul>
      </section>

      {/* Grant Access Section */}
      <section className="section">
        <h2>Pending Access Requests</h2>
        <GrantAccessPage patientAddress={authState?.userAddress} />
      </section>

      {/* Recent Access Logs Section */}
      <section className="section">
        <h2>Recent Access Logs</h2>
        <ul>
          {accessLogs.map((log) => (
            <li key={log.id}>
              {log.date}: {log.action}
            </li>
          ))}
        </ul>
      </section>

      {/* Manage Permissions Section */}
      <section className="section">
        <h2>Manage Permissions</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Access</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td>{perm.name}</td>
                <td>{perm.type}</td>
                <td>{perm.access ? "Granted" : "Revoked"}</td>
                <td>
                  <button onClick={() => togglePermission(perm.id, perm.access)}>
                    {perm.access ? "Revoke" : "Grant"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default PatientDashboard;
