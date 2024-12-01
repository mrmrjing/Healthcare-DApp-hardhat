import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import {
  getProviderRegistryEvents,
  isAuthorized,
  grantAccessToProvider,
  revokeAccessFromProvider,
  getMyMedicalRecords,
} from "../../services/blockchain/contractService";
import UploadMedicalRecord from "../Patient/UploadMedicalRecord";
import GrantAccessPage from "../Patient/GrantAccessPage";
import "../../styles/PatientDashboard.css";

const PatientDashboard = () => {
  const { authState, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [accessLogs, setAccessLogs] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const patientAddress = authState?.userAddress;
    if (patientAddress) {
      fetchDashboardData(patientAddress);
      fetchMedicalRecords(patientAddress);
    }
  }, [authState?.userAddress]);

  const fetchDashboardData = async (patientAddress) => {
    try {
      setLoading(true);

      // Fetch provider registration events
      const providerEvents = await getProviderRegistryEvents();

      // Filter to include only those with explicit access granted
      const filteredEvents = await Promise.all(
        providerEvents.map(async (event) => {
          const hasAccess = await isAuthorized(patientAddress, event.address);
          return hasAccess ? event : null;
        })
      );

      // Remove null values (providers without access)
      const authorizedProviders = filteredEvents.filter(Boolean);

      // Prepare access logs
      setAccessLogs(
        authorizedProviders.map((event) => ({
          id: event.address,
          date: new Date().toLocaleDateString(),
          action: `Access granted to ${event.address}`,
        }))
      );

      // Prepare permissions list
      const permissions = authorizedProviders.map((event) => ({
        id: event.address,
        name: event.dataCID,
        type: "Provider",
        access: true, // Explicitly granted access
      }));
      setPermissions(permissions);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to fetch data from the blockchain.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async (patientAddress) => {
    try {
      const records = await getMyMedicalRecords(patientAddress);
      setMedicalRecords(records);
    } catch (err) {
      setError("Failed to fetch medical records.");
    }
  };

  const togglePermission = async (providerAddress, currentAccess) => {
    try {
      if (currentAccess) {
        await revokeAccessFromProvider(providerAddress);
      } else {
        await grantAccessToProvider(providerAddress);
      }
      setPermissions((prevPermissions) =>
        prevPermissions.map((perm) =>
          perm.id === providerAddress ? { ...perm, access: !perm.access } : perm
        )
      );
    } catch (err) {
      setError(`Failed to ${currentAccess ? "revoke" : "grant"} permission.`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleUploadSuccess = () => {
    // Refresh the medical records list after a successful upload
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
        <h2>Upload Medical Record</h2>
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
                <p><strong>CID:</strong> {record.encryptedCID}</p>
                <p><strong>Timestamp:</strong> {record.timestamp}</p>
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
                  <button
                    onClick={() => togglePermission(perm.id, perm.access)}
                  >
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
