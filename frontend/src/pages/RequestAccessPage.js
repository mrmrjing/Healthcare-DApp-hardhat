import React, { useState, useContext } from "react";
import { create } from "ipfs-http-client";
import {
  requestAccess,
  getEncryptedKey,
  getSigner,
  getPatientRecords,
  getAuthorizedCIDs,
} from "../services/blockchain/contractService";
import { AuthContext } from "../contexts/AuthContext";
const { isAddress, toUtf8String } = require("ethers");
const CryptoJS = require("crypto-js");
const EC = require("elliptic").ec;

const RequestAccessPage = () => {
  const [patientAddress, setPatientAddress] = useState("");
  const [purpose, setPurpose] = useState("");
  const [retrieveAddress, setRetrieveAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [decryptedKey, setDecryptedKey] = useState("");
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

      if (!retrieveAddress || !isAddress(retrieveAddress)) {
        console.warn("[WARN] Invalid patient address provided for key retrieval:", retrieveAddress);
        setMessage("Please enter a valid patient address to retrieve the key.");
        return;
      }

      if (!privateKey) {
        console.warn("[WARN] No private key provided for decryption.");
        setMessage("Please provide your private key for decryption.");
        return;
      }

      const normalizedPrivateKey = privateKey.startsWith("0x")
        ? privateKey.slice(2)
        : privateKey;

      console.log("[DEBUG] Normalized private key:", normalizedPrivateKey);

      const providerAddress = await getProviderAddress();
      console.log("[DEBUG] Provider address fetched:", providerAddress);

      console.log("[DEBUG] Fetching encrypted symmetric key...");
      const encryptedKey = await getEncryptedKey(providerAddress, retrieveAddress);
      console.log("[DEBUG] Encrypted symmetric key retrieved:", encryptedKey);

      console.log("[DEBUG] Decrypting symmetric key...");
      const decryptedSymmetricKey = decryptKey(encryptedKey, normalizedPrivateKey);
      console.log("[INFO] Symmetric key decrypted successfully:", decryptedSymmetricKey);
      setDecryptedKey(decryptedSymmetricKey);

      setMessage("Decryption successful! Retrieving patient records...");

      console.log("[DEBUG] Fetching patient records...");
      const patientRecords = await getPatientRecords(retrieveAddress);
      if (patientRecords.length === 0) {
        console.warn("[WARN] No records found for the specified patient.");
        setMessage("No medical records found for this patient.");
        return;
      }
      console.log("[DEBUG] Patient records retrieved:", patientRecords);

      console.log("[DEBUG] Fetching authorized CID for provider...");
      const cid = await getAuthorizedCIDs(providerAddress, retrieveAddress);
      console.log("[INFO] Authorized CID retrieved:", cid);

      const fetchFromIPFS = async (cid) => {
        try {
          console.log("[DEBUG] Initiating fetch for CID:", cid);
      
          let content = "";
          for await (const chunk of ipfs.cat(cid)) {
            console.log("[DEBUG] Fetched chunk size (bytes):", chunk.length);
            content += new TextDecoder().decode(chunk);
          }
      
          console.log("[INFO] Encrypted content fetched successfully from IPFS.");
          console.log("[DEBUG] Total content length (Base64):", content.length);
          console.log("[DEBUG] Encrypted content (Preview):", content.slice(0, 100)); // Log a preview of the content
      
          return content; // Return Base64 string
        } catch (error) {
          console.error("[ERROR] Error fetching encrypted content from IPFS for CID:", cid);
          console.error("[ERROR] Details:", error);
          throw error;
        }
      };
      
      
      

      const decryptRecord = (encryptedContent, symmetricKey) => {
        try {
          console.log("[DEBUG] Symmetric key received for decryption:", symmetricKey);
      
          const key = symmetricKey.words ? symmetricKey : CryptoJS.enc.Hex.parse(symmetricKey);
          console.log("[DEBUG] Symmetric key (Hex):", key.toString(CryptoJS.enc.Hex));
      
          const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");
          console.log("[DEBUG] IV parsed successfully for decryption.");
      
          const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });
      
          console.log("[DEBUG] Raw decrypted bytes length:", decryptedBytes.sigBytes);
      
          // Convert decrypted bytes to Uint8Array (binary data)
          const binaryData = new Uint8Array(
            decryptedBytes.words.map((word, index) => {
              const byteOffset = (index % 4) * 8;
              return (word >> (24 - byteOffset)) & 0xff;
            })
          );
      
          console.log("[DEBUG] Decrypted binary data length:", binaryData.length);
      
      
          return binaryData; // Return binary data for further processing
        } catch (error) {
          console.error("[ERROR] Failed to decrypt record. Details:", error);
          throw new Error(`Decryption error: ${error.message}`);
        }
      };
      
      
      
      
      
      

      console.log("[INFO] Decrypting all patient records...");
      const records = await Promise.all(
        patientRecords.map(async (record) => {
          const { CID } = record; 
          if (!CID) {
            console.warn("[WARN] Missing recordCID in record:", record);
            return null; // Skip records with missing CID
          }
          const encryptedContent = await fetchFromIPFS(CID);
          return decryptRecord(encryptedContent, decryptedSymmetricKey);
        })
      );

      console.log("[INFO] All records decrypted successfully.");
      setDecryptedRecords(records.filter((record) => record !== null)); // Filter out null records

      setMessage("Medical records retrieved and decrypted successfully!");
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
      console.log("[DEBUG] Fetching provider address from MetaMask...");
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        console.log("[INFO] Provider address fetched successfully:", accounts[0]);
        return accounts[0];
      } else {
        throw new Error("No accounts found. Please connect to MetaMask.");
      }
    } catch (error) {
      console.error("[ERROR] Error fetching provider address:", error);
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

      // Convert decrypted bytes to hex string 
      const decryptedSymmetricKeyHex = decryptedBytes.toString(CryptoJS.enc.Hex);

      // Parse the hext string into a WordArray
      const decryptedSymmetricKey = CryptoJS.enc.Hex.parse(decryptedSymmetricKeyHex);

      console.log("[INFO] Symmetric key decrypted successfully:", decryptedSymmetricKey);
      return decryptedSymmetricKey;
    } catch (error) {
      console.error("[ERROR] Error decrypting symmetric key:", error);
      throw new Error("Failed to decrypt the symmetric key.");
    }
  };

  const hexToUtf8 = (hex) => {
    console.log("[DEBUG] Converting hex to UTF-8...");
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

      {decryptedRecords.length > 0 && (
        <div className="decrypted-records">
          <h3>Decrypted Records:</h3>
          <ul>
            {decryptedRecords.map((record, index) => (
              <li key={index}>{record}</li>
            ))}
          </ul>
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
