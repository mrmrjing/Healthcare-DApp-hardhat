import React, { useState, useContext } from "react";
import { requestAccess, getEncryptedKey, getSigner } from "../services/blockchain/contractService";
import { AuthContext } from "../contexts/AuthContext"; // Import AuthContext
const { isAddress, toUtf8String, toUtf8Bytes, constants } = require("ethers");
const CryptoJS = require("crypto-js");
const EC = require("elliptic").ec;

const RequestAccessPage = () => {
  const [patientAddress, setPatientAddress] = useState("");
  const [purpose, setPurpose] = useState("");
  const [retrieveAddress, setRetrieveAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [decryptedKey, setDecryptedKey] = useState("");
  const [message, setMessage] = useState("");

  const { logout } = useContext(AuthContext); // Access logout from AuthContext

  const handleRequestAccess = async () => {
    try {
      console.log("Request Access button clicked");
      setMessage("");

      if (!patientAddress || !isAddress(patientAddress)) {
        setMessage("Please enter a valid patient address.");
        return;
      }

      if (!purpose) {
        setMessage("Please provide a purpose for the access request.");
        return;
      }

      await requestAccess(patientAddress, purpose);
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
      console.log("[DEBUG] handleRetrieveKey invoked.");
  
      if (!retrieveAddress || !isAddress(retrieveAddress)) {
        console.warn("[WARN] Invalid retrieveAddress:", retrieveAddress);
        setMessage("Please enter a valid patient address to retrieve the key.");
        return;
      }
  
      if (!privateKey) {
        console.warn("[WARN] Private key not provided.");
        setMessage("Please provide your private key for decryption.");
        return;
      }
      // Normalize private key (remove 0x prefix if present)
      const normalizedPrivateKey = privateKey.startsWith("0x") 
        ? privateKey.slice(2) 
        : privateKey;
  
      const providerAddress = await getProviderAddress();
      console.log("[DEBUG] Provider address:", providerAddress);
  
      const encryptedKey = await getEncryptedKey(providerAddress, retrieveAddress);
      console.log("[DEBUG] Encrypted key retrieved:", encryptedKey);
  
      const decryptedSymmetricKey = decryptKey(encryptedKey, normalizedPrivateKey);
      console.log("[DEBUG] Decrypted symmetric key:", decryptedSymmetricKey);
  
      setDecryptedKey(decryptedSymmetricKey);
      setMessage("Decryption successful! Use the key to access the patient record.");
    } catch (error) {
      console.error("[ERROR] Error retrieving or decrypting the key:", error);
      setMessage("Failed to retrieve or decrypt the key. Ensure access is approved.");
    }
  };
  
  

  const getProviderAddress = async () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("Ethereum provider not found. Please install MetaMask.");
    }
  
    try {
      // Request accounts from the provider (MetaMask)
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
  
      // Return the first account if available
      if (accounts.length > 0) {
        return accounts[0];
      } else {
        throw new Error("No accounts found. Please connect to MetaMask.");
      }
    } catch (error) {
      console.error("Error fetching provider address:", error);
      throw error;
    }
  };


const decryptKey = (encryptedKeyHex, privateKeyHex) => {
  try {
    console.log("[DEBUG] Starting decryption process.");
    console.log("[DEBUG] Encrypted key hex:", encryptedKeyHex);
    console.log("[DEBUG] Private key hex:", privateKeyHex);

    // Decode the hex-encoded JSON string
    const encryptedKeyJSON = hexToUtf8(encryptedKeyHex);
    console.log("[DEBUG] Decoded encrypted key JSON:", encryptedKeyJSON);

    // Parse the decoded JSON
    const encryptedKeyObject = JSON.parse(encryptedKeyJSON);
    console.log("[DEBUG] Parsed encrypted key object:", encryptedKeyObject);

    const { ephemeralPublicKey, encryptedSymmetricKey } = encryptedKeyObject;

    if (!ephemeralPublicKey || !encryptedSymmetricKey) {
      console.error("[ERROR] Missing fields in encrypted key object.");
      console.log("[DEBUG] ephemeralPublicKey:", ephemeralPublicKey);
      console.log("[DEBUG] encryptedSymmetricKey:", encryptedSymmetricKey);
      throw new Error("Missing ephemeralPublicKey or encryptedSymmetricKey.");
    }

    console.log("[DEBUG] Ephemeral public key:", ephemeralPublicKey);
    console.log("[DEBUG] Encrypted symmetric key:", encryptedSymmetricKey);

    const ec = new EC("secp256k1");

    const providerPrivateKey = ec.keyFromPrivate(privateKeyHex, "hex");
    console.log("[DEBUG] Provider private key created successfully.", providerPrivateKey);

    const derivedPublicKey = providerPrivateKey.getPublic(true,"hex");
    console.log("[DEBUG] Derived public key (Hex):", derivedPublicKey);

    const ephemeralKey = ec.keyFromPublic(ephemeralPublicKey, "hex");
    console.log("[DEBUG] Ephemeral public key object created successfully:", ephemeralKey);

    const sharedSecret = providerPrivateKey.derive(ephemeralKey.getPublic());
    console.log("[DEBUG] Shared secret derived (Decryption side):", sharedSecret.toString(16));

    const aesKey = sharedSecret.toString(16);
    console.log("[DEBUG] AES key generated:", aesKey);

    
    // Check if encryptedSymmetricKey is a valid Base64 string
    if (typeof encryptedSymmetricKey !== "string" || !encryptedSymmetricKey) {
      console.error("[ERROR] Invalid encryptedSymmetricKey format.");
      throw new Error("Invalid encryptedSymmetricKey format.");
    }

    const decryptedBytes = CryptoJS.AES.decrypt(encryptedSymmetricKey, aesKey);

    if (!decryptedBytes) {
      console.error("[ERROR] Decryption produced empty bytes.");
      throw new Error("Decryption produced empty bytes.");
    }

    console.log("[DEBUG] Decrypted bytes (Base64):", decryptedBytes.toString(CryptoJS.enc.Base64));

    // Decode to UTF-8
    const decryptedSymmetricKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedSymmetricKey) {
      console.error("[ERROR] UTF-8 decoding failed.");
      throw new Error("UTF-8 decoding failed.");
    }

    console.log("[DEBUG] Decrypted symmetric key:", decryptedSymmetricKey);
    return decryptedSymmetricKey;
  } catch (error) {
    console.error("[ERROR] Error decrypting key:", error);
    throw new Error("Failed to decrypt the key. Ensure the private key is correct.");
  }
};

const hexToUtf8 = (hex) => {
  return toUtf8String(hex);
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

      <button onClick={logout} style={{ marginTop: "20px", backgroundColor: "red", color: "white" }}>
        Log Out
      </button>
    </div>
  );
};

export default RequestAccessPage;
