import React, { useEffect, useState } from "react";
import {
  approveAccess,
  revokeAccess,
  fetchPendingRequests,
  getProviderPublicKey,
  getMyMedicalRecords,
} from "../../services/blockchain/contractService";
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

  console.log("[DEBUG] Patient Address prop received:", patientAddress);

  useEffect(() => {
    const loadAccessRequests = async () => {
      try {
        console.log("Loading access requests for patient:", patientAddress);

        setLoading(true);
        const requests = await fetchPendingRequests(patientAddress);
        const records = await getMyMedicalRecords(); // Fetch medical records

        console.log("Fetched pending access requests:", requests);
        console.log("Fetched medical records:", records);

        setAccessRequests(requests || []);
        setMedicalRecords(records || []);
      } catch (err) {
        console.error("Error fetching access requests or medical records:", err);
        setError("Failed to load access requests or medical records.");
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

  const handleCIDSelection = (event, requestIndex) => {
    const selectedOptions = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    setSelectedCIDs((prev) => ({
      ...prev,
      [requestIndex]: selectedOptions,
    }));
    console.log("[DEBUG] Updated selectedCIDs state:", { ...selectedCIDs, [requestIndex]: selectedOptions });
  };

  const handleApprove = async (request, index) => {
    try {
      console.log("[DEBUG] Approve request initiated for:", request);
  
      const selectedCIDsForRequest = selectedCIDs[index];
      if (!selectedCIDsForRequest || !Array.isArray(selectedCIDsForRequest) || selectedCIDsForRequest.length === 0) {
        console.warn("[WARN] Invalid or empty selectedCIDsForRequest:", selectedCIDsForRequest);
        setMessage("Please select at least one CID.");
        return;
      }
      if (!masterPassword) {
        setMessage("Please enter your master password to approve access.");
        return;
      }

      console.log("[DEBUG] Selected CIDs for request:", selectedCIDsForRequest);

      // Regenerate the symmetric key from the master password
      const deriveKey = (password) => {
        const salt = CryptoJS.enc.Hex.parse("a9b8c7d6e5f4a3b2"); // Fixed salt
        return CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 })
      };
      const symmetricKey = deriveKey(masterPassword);
      console.log("[DEBUG] Regenerated Symmetric Key:", symmetricKey.toString(CryptoJS.enc.Hex));

      // Fetch the provider's public key
      const publicKeyBytes = await getProviderPublicKey(request.doctorAddress);
      console.log("[DEBUG] Raw provider public key bytes:", publicKeyBytes);
  
      const publicKeyHex = hexlify(publicKeyBytes).substring(2);
      console.log("[DEBUG] Provider Public Key (Hex):", publicKeyHex);
  
      const doctorPublicKey = ec.keyFromPublic(publicKeyHex, "hex");
      console.log("[DEBUG] Derived Doctor Public Key:", doctorPublicKey);
  
      // Generate ephermeral key pair for the patient
      const patientEphemeralKeyPair = ec.genKeyPair();
      const ephemeralPublicKey = patientEphemeralKeyPair.getPublic("hex");
      console.log("[DEBUG] Generated Patient Ephemeral Public Key:", ephemeralPublicKey);
      
      // Derive shared secret from patient's ephermeral private key and doctor's public key
      const sharedSecret = patientEphemeralKeyPair.derive(doctorPublicKey.getPublic());
      console.log("[DEBUG] Derived Shared Secret (Encryption Side):", sharedSecret.toString(16));
  
      const deriveAESKey = (sharedSecretHex, keyLength = 32) => {
        const paddedKey = sharedSecretHex.padStart(keyLength * 2, '0').slice(0, keyLength * 2);
        return CryptoJS.enc.Hex.parse(paddedKey);
      };

      // Encrypt the symmetric key using the shared secret
      const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f"); // Fixed IV for encryption

      const aesKey = deriveAESKey(sharedSecret.toString(16));
      console.log("[DEBUG] Derived AES Key (Encryption):", aesKey.toString());
      console.log("[DEBUG] Type of AES Key:", typeof aesKey);

      // Convert symmetric key to hex string
      const symmetricKeyHex = symmetricKey.toString(CryptoJS.enc.Hex);
  
      const encryptedSymmetricKey = CryptoJS.AES.encrypt(symmetricKeyHex, aesKey, {
        iv: iv, // Fixed IV
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }).toString();
      console.log("[DEBUG] Encrypted Symmetric Key:", encryptedSymmetricKey);
      

      // Prepare the payload to be sent to the doctor
      const encryptedKeyObject = {
        ephemeralPublicKey,
        encryptedSymmetricKey,
      };
      console.log("[DEBUG] Encrypted Key Object Created:", encryptedKeyObject);
  
      const encryptedKeyJSON = JSON.stringify(encryptedKeyObject);
      console.log("[DEBUG] Encrypted Key Object (JSON String):", encryptedKeyJSON);
  
      const encryptedKeyBytes = toUtf8Bytes(encryptedKeyJSON);
      console.log("[DEBUG] Encrypted Key Object (Bytes):", encryptedKeyBytes);
  
      const joinedCIDs = selectedCIDsForRequest.join(",");
      console.log("[DEBUG] Joined CIDs:", joinedCIDs);
  
      await approveAccess(request.doctorAddress, encryptedKeyBytes, joinedCIDs);
      console.log("[DEBUG] Access approved for doctor:", request.doctorAddress);
  
      setAccessRequests((prev) => prev.filter((_, i) => i !== index));
      setMessage("Access approved successfully.");
    } catch (error) {
      console.error("[ERROR] Error in handleApprove:", error);
      setMessage("Failed to approve access.");
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
                  <select
                    multiple
                    onChange={(e) => handleCIDSelection(e, index)}
                  >
                    {medicalRecords.map((record, i) => (
                      <option key={i} value={record.CID}>
                        {record.CID}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleApprove(request, index)}
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
