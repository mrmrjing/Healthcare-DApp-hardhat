import React, { useState, useContext } from "react";
import { create } from "ipfs-http-client";
import {
  requestAccess,
  getEncryptedKey,
  getPatientRecords,
} from "../services/contractService";
import { AuthContext } from "../contexts/AuthContext";
import { isAddress, toUtf8String } from "ethers";
import CryptoJS from "crypto-js";
import { ec as EC } from "elliptic";

// Initialize elliptic curve for cryptographic operations
const ec = new EC("secp256k1");

const RequestAccessPage = () => {
  // Component state to manage input values and results
  const [patientAddress, setPatientAddress] = useState(""); 
  const [purpose, setPurpose] = useState(""); 
  const [retrieveAddress, setRetrieveAddress] = useState(""); 
  const [privateKey, setPrivateKey] = useState(""); 
  const [message, setMessage] = useState(""); 
  const [decryptedRecords, setDecryptedRecords] = useState([]); 

  // Context for authentication, e.g., logout functionality
  const { logout } = useContext(AuthContext);

  // Initialize IPFS client for communication with a local IPFS node
  const ipfs = create({ url: "http://localhost:5001/api/v0" });

  /**
   * Handles access request submission to the blockchain.
   */
  const handleRequestAccess = async () => {
    try {
      setMessage(""); // Clear previous messages

      // Validate patient address
      if (!patientAddress || !isAddress(patientAddress)) {
        console.warn("[WARN] Invalid patient address:", patientAddress);
        setMessage("Please enter a valid Ethereum address.");
        return;
      }

      // Validate purpose
      if (!purpose.trim()) {
        console.warn("[WARN] Purpose field is empty.");
        setMessage("Purpose of access request cannot be empty.");
        return;
      }

      console.log("[INFO] Initiating access request...");
      await requestAccess(patientAddress, purpose);
      console.log("[INFO] Access request sent successfully.");

      // Clear inputs and provide success feedback
      setMessage("Access request sent successfully!");
      setPatientAddress("");
      setPurpose("");
    } catch (error) {
      console.error("[ERROR] Failed to send access request:", error);
      setMessage("Failed to send access request. Please try again.");
    }
  };

  /**
   * Handles the retrieval of the decryption key and patient records.
   */
  const handleRetrieveKey = async () => {
    try {
      setMessage(""); // Clear previous messages

      // Validate inputs
      if (!retrieveAddress || !isAddress(retrieveAddress)) {
        console.warn("[WARN] Invalid retrieve address:", retrieveAddress);
        setMessage("Please enter a valid Ethereum address.");
        return;
      }
      if (!privateKey.trim()) {
        console.warn("[WARN] Private key field is empty.");
        setMessage("Private key cannot be empty.");
        return;
      }

      // Normalize private key (remove 0x if present)
      const normalizedPrivateKey = privateKey.startsWith("0x")
        ? privateKey.slice(2)
        : privateKey;
      console.log("[DEBUG] Normalized private key:", normalizedPrivateKey);

      // Retrieve provider address
      const providerAddress = await fetchProviderAddress();
      console.log("[INFO] Provider address retrieved:", providerAddress);

      // Fetch the encrypted symmetric key
      const encryptedKey = await getEncryptedKey(providerAddress, retrieveAddress);
      console.log("[INFO] Encrypted symmetric key retrieved.");

      // Decrypt the symmetric key using elliptic curve cryptography
      const decryptedSymmetricKey = decryptKey(encryptedKey, normalizedPrivateKey);
      console.log("[INFO] Symmetric key decrypted successfully.");

      setMessage("Decryption successful! Fetching patient records...");

      // Fetch and decrypt patient records
      const records = await fetchAndDecryptRecords(retrieveAddress, decryptedSymmetricKey);
      setDecryptedRecords(records);

      setMessage("Patient records retrieved and decrypted successfully!");
    } catch (error) {
      console.error("[ERROR] Failed to retrieve records:", error);
      setMessage("Failed to retrieve records. Ensure inputs are correct and try again.");
    }
  };

  /**
   * Fetches content from IPFS using a given CID.
   */
  const fetchFromIPFS = async (cid) => {
    try {
      console.log(`[INFO] Fetching content from IPFS for CID: ${cid}`);
      let content = "";
      for await (const chunk of ipfs.cat(cid)) {
        content += new TextDecoder().decode(chunk);
      }
      return content;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch IPFS content for CID: ${cid}`, error);
      throw error;
    }
  };

  /**
   * Decrypts an encrypted patient record using the symmetric key.
   */
  const decryptRecord = (encryptedContent, symmetricKey) => {
    try {
      if (!encryptedContent || !symmetricKey) {
        throw new Error("Missing content or key for decryption.");
      }

      const key = CryptoJS.enc.Hex.parse(symmetricKey);
      const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return new Blob([decryptedBytes.toString(CryptoJS.enc.Latin1)], { type: "application/pdf" });
    } catch (error) {
      console.error("[ERROR] Failed to decrypt record:", error);
      throw error;
    }
  };

  /**
   * Retrieves the Ethereum provider address connected via MetaMask.
   */
  const fetchProviderAddress = async () => {
    try {
      console.log("[INFO] Fetching connected Ethereum account...");
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length === 0) throw new Error("No accounts connected. Please connect MetaMask.");
      return accounts[0];
    } catch (error) {
      console.error("[ERROR] Failed to fetch provider address:", error);
      throw error;
    }
  };

  /**
   * Decrypts a symmetric key using elliptic curve cryptography.
   */
  const decryptKey = (encryptedKeyHex, privateKeyHex) => {
    try {
      console.log("[INFO] Decrypting symmetric key...");
      const encryptedKey = JSON.parse(toUtf8String(encryptedKeyHex));
      const { ephemeralPublicKey, encryptedSymmetricKey } = encryptedKey;

      const providerPrivateKey = ec.keyFromPrivate(privateKeyHex, "hex");
      const ephemeralKey = ec.keyFromPublic(ephemeralPublicKey, "hex");
      const sharedSecret = providerPrivateKey.derive(ephemeralKey.getPublic());

      const aesKey = CryptoJS.enc.Hex.parse(sharedSecret.toString(16).padStart(64, "0"));
      const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedSymmetricKey, aesKey, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return decryptedBytes.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error("[ERROR] Failed to decrypt symmetric key:", error);
      throw error;
    }
  };

  /**
   * Fetches and decrypts all patient records using the provided symmetric key.
   */
  const fetchAndDecryptRecords = async (address, symmetricKey) => {
    try {
      console.log("[INFO] Fetching patient records...");
      const records = await getPatientRecords(address);
      if (!records || records.length === 0) {
        console.warn("[WARN] No records found for the specified address.");
        throw new Error("No records found.");
      }

      console.log(`[INFO] Found ${records.length} records. Starting decryption...`);
      const decryptedRecords = await Promise.all(
        records.map(async ({ CID }) => {
          const encryptedContent = await fetchFromIPFS(CID);
          return decryptRecord(encryptedContent, symmetricKey);
        })
      );

      console.log("[INFO] Records decrypted successfully.");
      return decryptedRecords;
    } catch (error) {
      console.error("[ERROR] Failed to fetch or decrypt records:", error);
      throw error;
    }
  };

  return (
    <div className="request-access-page">
      <h2>Request Access</h2>
      <div>
        <input
          type="text"
          value={patientAddress}
          onChange={(e) => setPatientAddress(e.target.value)}
          placeholder="Patient's Ethereum Address"
        />
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Purpose of Access"
        />
        <button onClick={handleRequestAccess}>Request Access</button>
      </div>

      <h2>Retrieve Records</h2>
      <div>
        <input
          type="text"
          value={retrieveAddress}
          onChange={(e) => setRetrieveAddress(e.target.value)}
          placeholder="Patient's Ethereum Address"
        />
        <input
          type="password"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Private Key"
        />
        <button onClick={handleRetrieveKey}>Retrieve Records</button>
      </div>

      {decryptedRecords.length > 0 && (
        <div>
          <h3>Decrypted Records</h3>
          <ul>
            {decryptedRecords.map((record, index) => {
              const url = URL.createObjectURL(record);
              return (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    View Record {index + 1}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {message && <p>{message}</p>}

      <button onClick={logout}>Log Out</button>
    </div>
  );
};

export default RequestAccessPage;
