import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { create } from "ipfs-http-client";
import { Buffer } from "buffer";
import {
  getProviderRegistryEvents,
  isAuthorized,
  checkAccess,
  revokeAccess,
  getMyMedicalRecords,
  fetchPendingRequests,
  checkPending,
  getApprovedEvents,
  getRevokedEvents
} from "../services/contractService";
import UploadMedicalRecord from "../components/Patient/UploadMedicalRecord";
import GrantAccess from "../components/Patient/GrantAccess";
import "../styles/PatientDashboard.css";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

// Initialize IPFS client for local node
const ipfs = create({ url: "http://localhost:5001/api/v0" });

const PatientDashboard = () => {
  const { authState, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState('upload');
  const [accessLogs, setAccessLogs] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when the component mounts or authState changes
  useEffect(() => {
    const patientAddress = authState?.userAddress;

    if (patientAddress) {
      fetchDashboardData(patientAddress);
      fetchMedicalRecords(patientAddress);
      fetchRequests(patientAddress);
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
          const hasAccess = await checkAccess(patientAddress, event.address);
          return hasAccess ? event : null;
        })
      );
      const authorizedProviders = filteredEvents.filter(Boolean);

      await Promise.all(authorizedProviders.map(async (e)=>{
        const docData = await getIPFSdata(e.dataCID);
        e["docName"] = docData.name
      }))

      setPermissions(
        authorizedProviders.map((event) => ({
          id: event.address,
          name: event.docName || "Unknown",
          type: "Provider",
          access: true,
        }))
      );
      // get approve and revoke logs
      const approveEvents = await getApprovedEvents(patientAddress)
      const revokeEvents = await getRevokedEvents(patientAddress)
      const logHistory = approveEvents.concat(revokeEvents)
      console.log("loghistory", logHistory)
      if (logHistory.length > 1){
        logHistory.sort((a, b) => {
          return Number(a.date) - Number(b.date)
        })
      }
      //Prepare access logs and permissions
      setAccessLogs(
        logHistory.map((event) => ({
          id: event.doctorAddress,
          date: event.date ? new Date(Number(event.date) * 1000).toString() : "invalid date",
          action: event.action === "Approved" ? `Access granted to ${event.doctorAddress}` : `Revoked access to ${event.doctorAddress}`,
        }))
      );
    } catch (err) {
      console.error("[ERROR] Failed to fetch dashboard data:", err);
      setError("Failed to fetch data from the blockchain.");
    } finally {
      setLoading(false);
    }
  };

  const handleReqUpdate = (newarr) => { setAccessRequests(newarr)}

  const getIPFSdata = async (cid) =>{
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    // Combine chunks and convert to a string (assuming the data is text-based)
    const data = Buffer.concat(chunks).toString();
    const dataobj = JSON.parse(data)
    return dataobj;
  }

  const fetchRequests = async (patientAddress) => {
    try {
      console.info("[INFO] Fetching requests for patient:", patientAddress);
      const reqs = await fetchPendingRequests(patientAddress);
      const pengingRequests = await Promise.all(
        reqs.map(async (req) => {
          const isPending = await checkPending(patientAddress, req.doctorAddress);
          return isPending ? req : null;
        })
      ).then((resolvedReqs) => resolvedReqs.filter(req => req !== null));
      console.log("pending: ", pengingRequests)
      const providerRegistryData = await getProviderRegistryEvents()
      const newReqs = await Promise.all(
        pengingRequests.map(async (req)=>{
          // Find all matching providers for the current req
          const matchingProvider = providerRegistryData.find((provider) => {
            return req.doctorAddress === provider.address
          });
          if (matchingProvider){
            try{
              const docData = await getIPFSdata(matchingProvider.dataCID);
              return {
                ...req,
                docName: docData.name
              };
            } catch (error) {
              console.log("Could not get IPFS data:", error)
              throw "ipfs error";
            }
          } else{
            throw "no doc data";
          }
        })
      )
      console.log("newreqs", newReqs)
      setAccessRequests(newReqs || []);
    } catch (err){
      console.error("[ERROR] Failed to get access requests:", err);
      setError("Failed to get access requests.");
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
  const revokePermission = async (providerAddress, currentAccess) => {
    try {
      console.info(
        `[INFO] ${currentAccess ? "Revoking" : "Granting"} access for provider:`,
        providerAddress
      );

      if (currentAccess) {
        await revokeAccess(providerAddress);
        //await revokeAccessFromProvider(providerAddress);
        const isauthval = await isAuthorized(authState?.userAddress, providerAddress);
        const hasaccessval = await checkAccess(authState?.userAddress, providerAddress);
        console.log("isAuthorised ", isauthval);
        console.log("hashaccess ", hasaccessval);
      }

      //Update permissions state
      setPermissions(prevPermissions =>
        prevPermissions.filter(perm => perm.id !== providerAddress)
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
      <div className="header-container">
        <h1>Patient Dashboard</h1>
        <div className="p-logout-button"><button onClick={handleLogout}>Log Out</button></div>
      </div>
      {/* <div className="logout-button">
        <button onClick={handleLogout}>Log Out</button>
      </div> */}
      {/* <h1>Patient Dashboard</h1> */}

      {/* Medical Record Upload Section */}
      <Box sx={{ width: '100%' }}>
        <Tabs
            value={tabValue}
            onChange={handleTabChange}
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="secondary tabs example"
            variant="scrollable"
            scrollButtons="auto"
            centere
          >
            <Tab value="upload" label="Upload" sx={{maxWidth: "180px"}}/>
            <Tab value="records" label="Records" sx={{maxWidth: "180px"}}/>
            <Tab value="requests" label="Requests" sx={{maxWidth: "180px"}}/>
            <Tab value="history" label="Access History" sx={{maxWidth: "180px"}}/>
          </Tabs>
      </Box>
      {tabValue === "upload" ? <section className="section">
        <UploadMedicalRecord
          patientAddress={authState?.userAddress}
          onUploadSuccess={handleUploadSuccess}
          changeTab={setTabValue}
        />
      </section>:''}

      {/* Medical Records List */}
      {tabValue === 'records'?<section className="section">
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
      </section>:''}

      {/* Recent Access Logs Section */}
      {tabValue === 'history' ? <section className="section">
        <h2>Recent Access Logs</h2>
        <ul>
          {accessLogs.map((log) => (
            <li key={log.id}>
              {log.date}: {log.action}
            </li>
          ))}
        </ul>
      </section>: ''}

      {/* Manage Permissions Section */}
      {tabValue === 'requests' ? <div>
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
                    <button onClick={() => revokePermission(perm.id, perm.access)} className={perm.access ? "revoke-button" : ""}>
                      {perm.access ? "Revoke" : "Grant"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {/* Grant Access Section */}
        <section className="section">
          <GrantAccess patientAddress={authState?.userAddress} accessRequests={accessRequests} medicalRecords={medicalRecords} setPermissions={setPermissions} updateReqs={handleReqUpdate}/>
        </section>
      </div>:''}
    </div>
  );
};

export default PatientDashboard;
