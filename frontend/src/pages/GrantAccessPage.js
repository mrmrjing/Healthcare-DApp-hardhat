import React, { useEffect, useState } from "react";
import {
  approveAccess,
  revokeAccess,
  fetchPendingRequests,
  getProviderPublicKey,
  getMyMedicalRecords,
} from "../services/blockchain/contractService";
import CryptoJS from "crypto-js";
import { ec as EC } from "elliptic";
import { hexlify, toUtf8Bytes } from "ethers";

// Initialize elliptic curve for secp256k1 (Ethereum's curve)
const ec = new EC("secp256k1");

const GrantAccessPage = ({ patientAddress }) => {
  const [accessRequests, setAccessRequests] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedCIDs, setSelectedCIDs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [masterPassword, setMasterPassword] = useState("");

  console.log("[DEBUG] Component initialized with patientAddress:", patientAddress);

  // Fetch access requests and medical records when component mounts or patientAddress changes
  useEffect(() => {
    const loadAccessRequests = async () => {
      if (!patientAddress) {
        console.warn("[WARN] Patient address is not defined.");
        setError("Patient address is required to fetch access requests.");
        return;
      }

      try {
        console.log("[INFO] Loading access requests for patient:", patientAddress);
        setLoading(true);

        const [requests, records] = await Promise.all([
          fetchPendingRequests(patientAddress),
          getMyMedicalRecords(),
        ]);

        console.log("[DEBUG] Fetched pending requests:", requests);
        console.log("[DEBUG] Fetched medical records:", records);

        setAccessRequests(requests || []);
        setMedicalRecords(records || []);
      } catch (err) {
        console.error("[ERROR] Failed to load access requests or medical records:", err);
        setError(
          "An error occurred while fetching access requests or medical records. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAccessRequests();
  }, [patientAddress]);

  // Handle the selection of CIDs
  const handleCIDSelection = (event, requestIndex) => {
    try {
      const selectedOptions = Array.from(event.target.selectedOptions).map(opt => opt.value);
      setSelectedCIDs(prev => ({ ...prev, [requestIndex]: selectedOptions }));
      console.log("[DEBUG] Updated selected CIDs:", { ...selectedCIDs, [requestIndex]: selectedOptions });
    } catch (err) {
      console.error("[ERROR] Failed to handle CID selection:", err);
      setMessage("An error occurred while selecting CIDs.");
    }
  };

  // Approve access for a specific request
  const handleApprove = async (request, index) => {
    if (!masterPassword) {
      setMessage("Please enter your master password to approve access.");
      return;
    }

    const selectedCIDsForRequest = selectedCIDs[index];
    if (!selectedCIDsForRequest || selectedCIDsForRequest.length === 0) {
      setMessage("Please select at least one CID.");
      return;
    }

    try {
      console.log("[INFO] Approving access for request:", request);

      // Regenerate symmetric key from master password
      const deriveKey = password => {
        const salt = CryptoJS.enc.Hex.parse("a9b8c7d6e5f4a3b2"); // Fixed salt
        return CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 });
      };
      const symmetricKey = deriveKey(masterPassword);

      // Fetch provider's public key
      const publicKeyBytes = await getProviderPublicKey(request.doctorAddress);
      if (!publicKeyBytes) {
        throw new Error("Provider public key not found.");
      }
      const publicKeyHex = hexlify(publicKeyBytes).substring(2);
      const doctorPublicKey = ec.keyFromPublic(publicKeyHex, "hex");

      // Generate ephemeral key pair
      const patientEphemeralKeyPair = ec.genKeyPair();
      const ephemeralPublicKey = patientEphemeralKeyPair.getPublic("hex");

      // Derive shared secret
      const sharedSecret = patientEphemeralKeyPair.derive(doctorPublicKey.getPublic());
      const deriveAESKey = (sharedSecretHex, keyLength = 32) => {
        const paddedKey = sharedSecretHex.padStart(keyLength * 2, "0").slice(0, keyLength * 2);
        return CryptoJS.enc.Hex.parse(paddedKey);
      };
      const aesKey = deriveAESKey(sharedSecret.toString(16));

      // Encrypt symmetric key
      const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f"); // Fixed IV
      const encryptedSymmetricKey = CryptoJS.AES.encrypt(
        symmetricKey.toString(CryptoJS.enc.Hex),
        aesKey,
        { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      ).toString();

      // Prepare encrypted key object
      const encryptedKeyObject = {
        ephemeralPublicKey,
        encryptedSymmetricKey,
      };
      const encryptedKeyJSON = JSON.stringify(encryptedKeyObject);
      const encryptedKeyBytes = toUtf8Bytes(encryptedKeyJSON);

      const joinedCIDs = selectedCIDsForRequest.join(",");
      await approveAccess(request.doctorAddress, encryptedKeyBytes, joinedCIDs);

      console.log("[INFO] Successfully approved access for doctor:", request.doctorAddress);

      setAccessRequests(prev => prev.filter((_, i) => i !== index));
      setMessage("Access approved successfully.");
    } catch (error) {
      console.error("[ERROR] Failed to approve access:", error);
      if (error.message.includes("Provider public key")) {
        setMessage("Failed to retrieve the provider's public key.");
      } else {
        setMessage("An unexpected error occurred while approving access.");
      }
    }
  };

  // Revoke access for a specific doctor
  const handleRevoke = async doctorAddress => {
    try {
      console.log("[INFO] Revoking access for doctor:", doctorAddress);
      await revokeAccess(doctorAddress);

      setAccessRequests(prev => prev.filter(request => request.doctorAddress !== doctorAddress));
      setMessage(`Access revoked for doctor: ${doctorAddress}`);
    } catch (err) {
      console.error("[ERROR] Failed to revoke access:", err);
      setMessage("An error occurred while revoking access.");
    }
  };

  if (loading) return <p>Loading access requests...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="grant-access-page">
      <h2>Grant Access</h2>
      <div>
        <label>Master Password:</label>
        <input
          type="password"
          value={masterPassword}
          onChange={e => setMasterPassword(e.target.value)}
        />
        <p><em>Your master password is used to decrypt your encryption keys.</em></p>
      </div>
      {accessRequests.length > 0 ? (
        <table className="access-requests-table">
          <thead>
            <tr>
              <th>Doctor Address</th>
              <th>Purpose</th>
              <th>Select Medical Records (CIDs)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accessRequests.map((request, index) => (
              <tr key={index}>
                <td>{request.doctorAddress}</td>
                <td>{request.plainTextPurpose}</td>
                <td>
                  <select multiple onChange={e => handleCIDSelection(e, index)}>
                    {medicalRecords.map((record, i) => (
                      <option key={i} value={record.CID}>{record.CID}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => handleApprove(request, index)} className="approve-button">Approve</button>
                  <button onClick={() => handleRevoke(request.doctorAddress)} className="revoke-button">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No pending access requests.</p>
      )}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default GrantAccessPage;
