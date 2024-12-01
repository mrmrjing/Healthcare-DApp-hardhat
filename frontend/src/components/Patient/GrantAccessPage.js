import React, { useEffect, useState } from "react";
import {
  approveAccess,
  revokeAccess,
  fetchPendingRequests, // Import the fetchPendingRequests function
  getProviderPublicKey,
} from "../../services/blockchain/contractService";
import CryptoJS from "crypto-js";
import { ec as EC } from "elliptic";
import { hexlify } from "ethers";

// Initialize elliptic curve for secp256k1 (Ethereum's curve)
const ec = new EC("secp256k1");

const GrantAccessPage = ({ patientAddress }) => {
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [masterPassword, setMasterPassword] = useState(""); // Master password to decrypt encryption keys

  console.log("[DEBUG] Patient Address prop received:", patientAddress);

  useEffect(() => {
    const loadAccessRequests = async () => {
      try {
        console.log("Loading access requests for patient:", patientAddress);

        setLoading(true);
        const requests = await fetchPendingRequests(patientAddress); // Call the fetchPendingRequests function

        console.log("Fetched pending access requests:", requests);

        if (!requests || requests.length === 0) {
          console.log("No pending access requests found.");
          setAccessRequests([]);
        } else {
          console.log("Setting access requests state with:", requests);
          setAccessRequests(requests);
        }
      } catch (err) {
        console.error("Error fetching access requests:", err);
        setError("Failed to load access requests.");
      } finally {
        setLoading(false);
      }
    };

    if (patientAddress) {
      loadAccessRequests();
    } else {
      console.warn("Patient address is not defined.");
    }
  }, [patientAddress]);

  const handleApprove = async (request) => {
    try {
      console.log("Approving access for request:", request);

      // Retrieve doctor's public key
      const publicKeyBytes = await getProviderPublicKey(request.doctorAddress);
      console.log("Retrieved doctor's public key:", publicKeyBytes);

      const publicKeyHex = hexlify(publicKeyBytes).substring(2);
      const doctorPublicKey = ec.keyFromPublic(publicKeyHex, "hex");

      // Retrieve encryption key for the medical record
      const encryptionKey = retrieveEncryptionKey(request.cid, masterPassword);

      if (!encryptionKey) {
        console.error("Failed to retrieve encryption key for CID:", request.cid);
        setMessage("Failed to retrieve encryption key. Check master password.");
        return;
      }

      console.log("Retrieved encryption key for CID:", request.cid);

      // Generate ephemeral key pair for secure key exchange
      const patientEphemeralKeyPair = ec.genKeyPair();
      const sharedSecret = patientEphemeralKeyPair.derive(
        doctorPublicKey.getPublic()
      );
      const aesKey = CryptoJS.SHA256(sharedSecret.toString(16)).toString();

      console.log("Generated AES key for encryption.");

      // Encrypt the encryption key
      const encryptedSymmetricKey = CryptoJS.AES.encrypt(
        encryptionKey,
        aesKey
      ).toString();

      const encryptedKeyObject = {
        ephemeralPublicKey: patientEphemeralKeyPair.getPublic("hex"),
        encryptedSymmetricKey,
        cid: request.cid,
      };

      const encryptedKeyJSON = JSON.stringify(encryptedKeyObject);

      console.log("Encrypted key object:", encryptedKeyJSON);

      // Approve access via blockchain
      await approveAccess(request.doctorAddress, encryptedKeyJSON);

      console.log("Access approved successfully on blockchain.");

      setAccessRequests((prev) =>
        prev.filter((req) => req.doctorAddress !== request.doctorAddress)
      );
      setMessage("Access approved successfully.");
    } catch (error) {
      console.error("Error approving access:", error);
      setMessage("Failed to approve access.");
    }
  };

  const retrieveEncryptionKey = (cid, password) => {
    const storedKeys = localStorage.getItem("encryptionKeys");
    if (!storedKeys) {
      console.warn("No encryption keys found in localStorage.");
      return null;
    }

    const encryptionKeys = JSON.parse(storedKeys);
    const encryptedKey = encryptionKeys[cid];

    if (!encryptedKey) {
      console.warn("No encryption key found for CID:", cid);
      return null;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
      const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedKey;
    } catch (error) {
      console.error("Error decrypting encryption key for CID:", cid, error);
      return null;
    }
  };

  const handleRevoke = async (doctorAddress) => {
    try {
      console.log("Revoking access for doctor:", doctorAddress);

      await revokeAccess(doctorAddress);

      console.log(`Access revoked for doctor: ${doctorAddress}`);
      setAccessRequests((prev) =>
        prev.filter((request) => request.doctorAddress !== doctorAddress)
      );
      setMessage(`Access revoked for doctor: ${doctorAddress}`);
    } catch (err) {
      console.error("Error revoking access:", err);
      setMessage("Failed to revoke access.");
    }
  };

  if (loading) {
    return <p>Loading access requests...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="grant-access-page">
      <h2>Grant Access</h2>
      <div>
        <label>Master Password:</label>
        <input
          type="password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
        />
        <p>
          <em>Your master password is used to decrypt your encryption keys.</em>
        </p>
      </div>
      {accessRequests.length > 0 ? (
        <table className="access-requests-table">
          <thead>
            <tr>
              <th>Doctor Address</th>
              <th>Purpose</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accessRequests.map((request, index) => (
              <tr key={index}>
                <td>{request.doctorAddress}</td>
                <td>{request.plainTextPurpose}</td>
                <td>
                  <button
                    onClick={() => handleApprove(request)}
                    className="approve-button"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRevoke(request.doctorAddress)}
                    className="revoke-button"
                  >
                    Reject
                  </button>
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
