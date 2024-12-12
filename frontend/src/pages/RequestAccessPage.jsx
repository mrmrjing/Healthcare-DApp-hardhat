import React, { useState, useContext } from "react";
import { create } from "ipfs-http-client";
import {
  requestAccess,
  getEncryptedKey,
  getPatientRecords,
  getAuthorizedCIDs,
} from "../services/contractService";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/PatientDashboard.css";
import TextField from '@mui/material/TextField';

const { isAddress, toUtf8String } = require("ethers");
const CryptoJS = require("crypto-js");
const EC = require("elliptic").ec;

const RequestAccessPage = () => {
  const [patientAddress, setPatientAddress] = useState("");
  const [purpose, setPurpose] = useState("");
  const [retrieveAddress, setRetrieveAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [message, setMessage] = useState("");
  const [decryptedRecords, setDecryptedRecords] = useState([]);

  const { logout } = useContext(AuthContext);

  // IPFS client configured for local node
  const ipfs = create({ url: "http://localhost:5001/api/v0" });

  const handleRequestAccess = async () => {
    try {
      console.log("[INFO] Initiating access request...");
      setMessage("");

      if (!patientAddress || !isAddress(patientAddress)) {
        console.warn("[WARN] Invalid patient address provided:", patientAddress);
        setMessage("Please enter a valid patient address.");
        return;
      }

      if (!purpose) {
        console.warn("[WARN] No purpose provided for access request.");
        setMessage("Please provide a purpose for the access request.");
        return;
      }

      console.log("[DEBUG] Sending access request to blockchain.");
      await requestAccess(patientAddress, purpose);

      console.log("[INFO] Access request sent successfully.");
      setMessage("Access request sent successfully!");
      setPatientAddress("");
      setPurpose("");
    } catch (error) {
      console.error("[ERROR] Error requesting access:", error);
      setMessage("Failed to send access request. Please try again.");
    }
  };

  const handleRetrieveKey = async () => {
    try {
      console.log("[INFO] Initiating key retrieval process...");
      setMessage("");
  
      // Validate retrieve address
      if (!retrieveAddress || !isAddress(retrieveAddress)) {
        console.warn("[WARN] Invalid patient address provided for key retrieval:", retrieveAddress);
        setMessage("Please enter a valid patient address to retrieve the key.");
        return;
      }
  
      // Validate private key
      if (!privateKey) {
        console.warn("[WARN] No private key provided for decryption.");
        setMessage("Please provide your private key for decryption.");
        return;
      }
  
      const normalizedPrivateKey = privateKey.startsWith("0x")
        ? privateKey.slice(2)
        : privateKey;
  
      console.log("[DEBUG] Normalized private key:", normalizedPrivateKey);
  
      // Fetch provider address
      let providerAddress;
      try {
        providerAddress = await getProviderAddress();
        console.log("[INFO] Provider address fetched successfully:", providerAddress);
      } catch (error) {
        console.error("[ERROR] Failed to fetch provider address:", error);
        setMessage("Failed to fetch provider address. Ensure MetaMask is connected.");
        return;
      }
  
      // Fetch encrypted symmetric key
      let encryptedKey;
      try {
        encryptedKey = await getEncryptedKey(providerAddress, retrieveAddress);
        console.log("[INFO] Encrypted symmetric key retrieved successfully.");
      } catch (error) {
        console.error("[ERROR] Failed to retrieve encrypted symmetric key:", error);
        setMessage("Failed to retrieve the encrypted key. Ensure access is approved.");
        return;
      }
  
      // Decrypt symmetric key
      let decryptedSymmetricKey;
      try {
        decryptedSymmetricKey = decryptKey(encryptedKey, normalizedPrivateKey);
        if (!decryptedSymmetricKey) {
          throw new Error("Decrypted symmetric key is null or undefined.");
        }
      } catch (error) {
        console.error("[ERROR] Failed to decrypt symmetric key:", error);
        setMessage("Failed to decrypt the symmetric key. Ensure your private key is correct.");
        return;
      }
  
      setMessage("Decryption successful! Retrieving patient records...");
  
      // Fetch patient records
      let patientRecords;
      try {
        patientRecords = await getPatientRecords(retrieveAddress);
        if (!patientRecords || patientRecords.length === 0) {
          console.warn("[WARN] No patient records found.");
          setMessage("No medical records found for this patient.");
          return;
        }
        console.log(`[INFO] Fetched ${patientRecords.length} patient records.`);
      } catch (error) {
        console.error("[ERROR] Failed to fetch patient records:", error);
        setMessage("Failed to fetch patient records. Please try again.");
        return;
      }
  
      // Fetch authorized CIDs
      let authorizedCIDs;
      try {
        authorizedCIDs = await getAuthorizedCIDs(providerAddress, retrieveAddress);
        if (!authorizedCIDs) {
          throw new Error("Authorized CID is null or undefined.");
        }
        console.log("[INFO] Authorized CIDs retrieved successfully:", authorizedCIDs);
      } catch (error) {
        console.error("[ERROR] Failed to fetch authorized CIDs:", error);
        setMessage("Failed to fetch authorized CIDs for the patient.");
        return;
      }
  
      // Filter records by authorized CIDs
      const authorizedRecords = patientRecords.filter(record =>
        authorizedCIDs.includes(record.CID)
      );
  
      if (authorizedRecords.length === 0) {
        console.warn("[WARN] No records match the authorized CIDs.");
        setMessage("No matching records found for authorized CIDs.");
        return;
      }
  
      console.log(`[INFO] ${authorizedRecords.length} records authorized for decryption.`);
  
      // Decrypt authorized records
      let records;
      try {
        records = await Promise.all(
          authorizedRecords.map(async (record) => {
            const { CID } = record;
            if (!CID) {
              console.warn("[WARN] Missing CID in record:", record);
              return null;
            }
            let encryptedContent;
            try {
              encryptedContent = await fetchFromIPFS(CID);
              if (!encryptedContent) {
                throw new Error(`Content for CID ${CID} is null or undefined.`);
              }
              console.log(`[INFO] Fetched encrypted content for CID: ${CID}`);
            } catch (error) {
              console.error(`[ERROR] Failed to fetch content from IPFS for CID: ${CID}`, error);
              return null;
            }
  
            try {
              return decryptRecord(encryptedContent, decryptedSymmetricKey);
            } catch (error) {
              console.error(`[ERROR] Failed to decrypt record for CID: ${CID}`, error);
              return null;
            }
          })
        );
        const validRecords = records.filter((record) => record !== null);
        if (validRecords.length === 0) {
          throw new Error("No records could be decrypted successfully.");
        }
        setDecryptedRecords(validRecords);
        console.log(`[INFO] Successfully decrypted ${validRecords.length} records.`);
      } catch (error) {
        console.error("[ERROR] Failed to decrypt patient records:", error);
        setMessage(
          "Failed to decrypt patient records. Ensure you have the correct key and access permissions."
        );
        return;
      }
  
      setMessage("Medical records retrieved and decrypted successfully!");
    } catch (error) {
      console.error("[ERROR] An unexpected error occurred in handleRetrieveKey:", error);
      setMessage("An unexpected error occurred while retrieving the key. Please try again.");
    }
  };
  
  const fetchFromIPFS = async (cid) => {
    try {
      let content = "";
      for await (const chunk of ipfs.cat(cid)) {
        content += new TextDecoder().decode(chunk);
      }
      return content;
    } catch (error) {
      console.error("[ERROR] Failed to fetch from IPFS:", error);
      throw error;
    }
  };

  const decryptRecord = (encryptedContent, symmetricKey) => {
    try {
      if (!encryptedContent) {
        throw new Error("Encrypted content is null or undefined.");
      }
      if (!symmetricKey) {
        throw new Error("Symmetric key is null or undefined.");
      }

      const key = symmetricKey.words ? symmetricKey : CryptoJS.enc.Hex.parse(symmetricKey);
      const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      if (!decryptedBytes || decryptedBytes.sigBytes <= 0) {
        throw new Error("Decryption resulted in empty or invalid output.");
      }

      const binaryData = new Uint8Array(
        decryptedBytes.words.flatMap((word, index) => [
          (word >> 24) & 0xff,
          (word >> 16) & 0xff,
          (word >> 8) & 0xff,
          word & 0xff,
        ])
      ).slice(0, decryptedBytes.sigBytes);

      return binaryData;
    } catch (error) {
      console.error("[ERROR] Failed to decrypt record:", error);
      throw error;
    }
  };

  const getProviderAddress = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please connect to MetaMask.");
      }
      return accounts[0];
    } catch (error) {
      console.error("[ERROR] Failed to fetch provider address:", error);
      throw error;
    }
  };

  const decryptKey = (encryptedKeyHex, privateKeyHex) => {
    try {
      console.log("[DEBUG] Starting decryption of symmetric key...");
      const ec = new EC("secp256k1");
      const encryptedKeyJSON = hexToUtf8(encryptedKeyHex);
      console.log("[DEBUG] Parsed encrypted key JSON:", encryptedKeyJSON);
      const encryptedKeyObject = JSON.parse(encryptedKeyJSON);
      const { ephemeralPublicKey, encryptedSymmetricKey } = encryptedKeyObject;
  
      const providerPrivateKey = ec.keyFromPrivate(privateKeyHex, "hex");
      const ephemeralKey = ec.keyFromPublic(ephemeralPublicKey, "hex");
      const sharedSecret = providerPrivateKey.derive(ephemeralKey.getPublic());
      console.log("[DEBUG] Shared secret derived successfully.");
  
      const deriveAESKey = (sharedSecretHex, keyLength = 32) => {
        const paddedKey = sharedSecretHex.padStart(keyLength * 2, "0").slice(0, keyLength * 2);
        return CryptoJS.enc.Hex.parse(paddedKey);
      };
  
      const aesKey = deriveAESKey(sharedSecret.toString(16));
      console.log("[DEBUG] AES key derived successfully:", aesKey.toString());
      const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");
  
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedSymmetricKey, aesKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
  
      // Check if decryption was successful
      if (!decryptedBytes || decryptedBytes.sigBytes <= 0) {
        throw new Error("Decryption failed. Invalid private key or corrupted data.");
      }
  
      const decryptedSymmetricKeyHex = decryptedBytes.toString(CryptoJS.enc.Utf8);
  
      if (!decryptedSymmetricKeyHex) {
        throw new Error("Decryption failed. Could not retrieve symmetric key.");
      }
  
      // Parse the decrypted symmetric key
      const decryptedSymmetricKey = CryptoJS.enc.Hex.parse(decryptedSymmetricKeyHex);
  
      console.log("[INFO] Symmetric key decrypted successfully:", decryptedSymmetricKey.toString(CryptoJS.enc.Hex));
      return decryptedSymmetricKey;
    } catch (error) {
      console.error("[ERROR] Error decrypting symmetric key:", error);
      throw new Error("Failed to decrypt the symmetric key.");
    }
  };

  const hexToUtf8 = (hex) => toUtf8String(hex);

  return (
    <div className="dashboard-container">
      <div className="header-container">
        <h1>Doctor Dashboard</h1>
        <div className="p-logout-button"><button onClick={logout}>Log Out</button></div>
      </div>
      <h2>Request Access to Patient Records</h2>
      <div className="doctor-section">
        <div className="input-section">
          <TextField 
            label="Patient's address" placeholder="Enter patient's Ethereum address"
            sx={{flexBasis:"50%"}}
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}/>
            <TextField 
            label="Purpose" placeholder="Purpose of access"
            sx={{flexBasis:"50%"}}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}/>
        </div>
        <button onClick={handleRequestAccess}>Request Access</button>
      </div>

      <h2>Retrieve Decryption Key</h2>
      <div className="doctor-section">
        <div className="input-section">
          <TextField 
            label="Patient's address" placeholder="Enter patient's Ethereum address"
            sx={{flexBasis:"50%"}}
            value={retrieveAddress}
            onChange={(e) => setRetrieveAddress(e.target.value)}/>
          <TextField 
            label="Private Key" placeholder="Enter your private Key" type="password"
            sx={{flexBasis:"50%"}}
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}/>
        </div>
        <button onClick={handleRetrieveKey}>Retrieve Key</button>
      </div>

      {decryptedRecords.length > 0 && (
      <div>
        <h3>Decrypted Records (PDFs)</h3>
        <ul>
          {decryptedRecords.map((record, index) => {
            // Create a Blob and Object URL for the PDF
            const blob = new Blob([record], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            return (
              <li key={index}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  View Medical Record {index + 1}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    )}

      {message && <p>{message}</p>}

    </div>
  );
};

export default RequestAccessPage;