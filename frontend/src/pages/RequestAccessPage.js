import React, { useState } from "react";
import { requestAccess, getEncryptedKey } from "../services/blockchain/contractService";
const { isAddress, keccak256, toUtf8Bytes, constants } = require("ethers");
const CryptoJS = require("crypto-js");
const EC = require("elliptic").ec;

const RequestAccessPage = () => {
  const [patientAddress, setPatientAddress] = useState("");
  const [purpose, setPurpose] = useState("");
  const [retrieveAddress, setRetrieveAddress] = useState(""); // New state for retrieve key address
  const [privateKey, setPrivateKey] = useState(""); // User-provided private key for decryption
  const [decryptedKey, setDecryptedKey] = useState("");
  const [message, setMessage] = useState("");

  const handleRequestAccess = async () => {
    try {
      console.log("Request Access button clicked"); // Log button click
      console.log("Patient Address Input:", patientAddress);
      console.log("Purpose Input:", purpose);
  
      setMessage("");
  
      // Validate patient address
      if (!patientAddress || !isAddress(patientAddress)) {
        setMessage("Please enter a valid patient address.");
        console.error("Invalid patient address:", patientAddress);
        return;
      }
  
      // Validate purpose
      if (!purpose) {
        setMessage("Please provide a purpose for the access request.");
        console.error("Missing purpose for access request");
        return;
      }
  
      // Call the blockchain function to request access
      console.log("Submitting requestAccess with:");
      console.log("Patient Address:", patientAddress);
      console.log("Purpose (plain text):", purpose);
  
      await requestAccess(patientAddress, purpose); // Pass plain text purpose directly
  
      console.log("Access request submitted to blockchain");
  
      setMessage("Access request sent successfully!");
      setPatientAddress("");
      setPurpose("");
    } catch (error) {
      console.error("Error requesting access:", error);
      setMessage("Failed to send access request. Please try again.");
    }
  };
  
  

  const handleRetrieveKey = async () => {
    try {
      setMessage("");

      // Validate patient address for key retrieval
      if (!retrieveAddress || !isAddress(retrieveAddress)) {
        setMessage("Please enter a valid patient address to retrieve the key.");
        return;
      }

      // Validate private key
      if (!privateKey) {
        setMessage("Please provide your private key for decryption.");
        return;
      }

      // Retrieve the encrypted key from the blockchain
      const encryptedKey = await getEncryptedKey(constants.AddressZero, retrieveAddress);

      console.log("Encrypted Key Retrieved:", encryptedKey);

      // Decrypt the key
      const decryptedSymmetricKey = decryptKey(encryptedKey, privateKey);
      setDecryptedKey(decryptedSymmetricKey);

      setMessage("Decryption successful! Use the key to access the patient record.");
    } catch (error) {
      console.error("Error retrieving or decrypting the key:", error);
      setMessage("Failed to retrieve or decrypt the key. Ensure access is approved.");
    }
  };

  return (
    <div className="request-access-page">
      <h2>Request Access to Patient Records</h2>
      <div className="form-group">
        <label>Patient Address:</label>
        <input
          type="text"
          value={patientAddress}
          onChange={(e) => setPatientAddress(e.target.value)}
          placeholder="Enter patient's Ethereum address"
        />
      </div>
      <div className="form-group">
        <label>Purpose of Access:</label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="E.g., Follow-up consultation"
        />
      </div>
      <button onClick={handleRequestAccess}>Request Access</button>

      <hr />

      <h2>Retrieve Decryption Key</h2>
      <div className="form-group">
        <label>Patient Address:</label>
        <input
          type="text"
          value={retrieveAddress}
          onChange={(e) => setRetrieveAddress(e.target.value)}
          placeholder="Enter patient's Ethereum address for key retrieval"
        />
      </div>
      <div className="form-group">
        <label>Private Key (For Decryption):</label>
        <input
          type="password"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Enter your private key"
        />
      </div>
      <button onClick={handleRetrieveKey}>Retrieve Key</button>

      {decryptedKey && (
        <div className="decrypted-key">
          <h3>Decrypted Key:</h3>
          <p>{decryptedKey}</p>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

// Function to decrypt the key
const decryptKey = (encryptedKeyJSON, privateKeyHex) => {
  try {
    // Parse the encrypted key object
    const encryptedKeyObject = JSON.parse(encryptedKeyJSON);
    const { ephemeralPublicKey, encryptedSymmetricKey } = encryptedKeyObject;

    // Initialize elliptic curve
    const ec = new EC("secp256k1");

    // Generate provider's private key object
    const providerPrivateKey = ec.keyFromPrivate(privateKeyHex, "hex");

    // Recreate ephemeral public key from the encrypted key object
    const ephemeralKey = ec.keyFromPublic(ephemeralPublicKey, "hex");

    // Derive shared secret using provider's private key and ephemeral public key
    const sharedSecret = providerPrivateKey.derive(ephemeralKey.getPublic());
    const aesKey = CryptoJS.SHA256(sharedSecret.toString(16)).toString();

    // Decrypt the symmetric encryption key
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedSymmetricKey, aesKey);
    const decryptedSymmetricKey = decryptedBytes.toString(CryptoJS.enc.Utf8);

    return decryptedSymmetricKey; // Return the decrypted key
  } catch (error) {
    console.error("Error decrypting key:", error);
    throw new Error("Failed to decrypt the key. Ensure the private key is correct.");
  }
};

export default RequestAccessPage;
