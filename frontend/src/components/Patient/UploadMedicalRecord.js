import React, { useState } from "react";
import { uploadMedicalRecord } from "../../services/blockchain/contractService";
import { create } from "ipfs-http-client";
import CryptoJS from "crypto-js";

// IPFS client configured for local node
const ipfs = create({ url: "http://localhost:5001/api/v0" });

const UploadMedicalRecord = ({ patientAddress, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [masterPassword, setMasterPassword] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!masterPassword) {
      setError("Please enter your master password to store the encryption key.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Derive symmetric key from master password
      const symmetricKey = deriveKey(masterPassword);
      console.log("Derived Symmetric Key:", symmetricKey.toString(CryptoJS.enc.Hex));

      // Encrypt the file
      const encryptedFile = await encryptFile(file, symmetricKey);

      // Save the encrypted file to IPFS
      const cid = await uploadToIPFS(encryptedFile);
      console.log("File uploaded to IPFS, CID:", cid);

      // Encrypt symmetric key with the master password
      const encryptedKey = CryptoJS.AES.encrypt(symmetricKey, masterPassword).toString();

      // Save CID and encrypted key securely
      saveEncryptionKey(cid, encryptedKey);

      // Record CID on the blockchain
      await uploadMedicalRecord(patientAddress, cid);

      console.log("Medical record stored on blockchain.");
      setFile(null);
      setMasterPassword("");
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("Error uploading medical record:", err);
      setError("Failed to upload medical record. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Function to derive a symmetric key from the master password
  const deriveKey = (password) => {
    // Derive a 256-bit key using PBKDF2 with a salt
    const salt = CryptoJS.enc.Hex.parse("a9b8c7d6e5f4a3b2"); // Random salt
    return CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 });
  };

  const encryptFile = (file, key) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileData = new Uint8Array(reader.result);
          const wordArray = CryptoJS.lib.WordArray.create(fileData);
          const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");
          console.log("[DEBUG] Symmetric key for encryption (Hex):", key.toString(CryptoJS.enc.Hex));
  
          const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });

          const encryptedBase64 = encrypted.toString(); // Base64 string
          console.log("[DEBUG] Encrypted content (Base64):", encryptedBase64.slice(0, 100)); // Preview only
          resolve(encryptedBase64); // Return Base64 string for storage
        } catch (encryptionError) {
          reject(encryptionError);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file); // Read file as binary data
    });
  };

  
  
  

  const uploadToIPFS = async (encryptedFile) => {
    try {
      const result = await ipfs.add(encryptedFile);
  
      // Ensure CID is stored as a string for blockchain storage
      const cid = result.cid.toString(); // Convert CID to a string
      console.log("[INFO] Encrypted file uploaded to IPFS. CID:", cid);
  
      return cid;
    } catch (error) {
      console.error("[ERROR] Error uploading to IPFS:", error);
      throw error;
    }
  };
  

  const saveEncryptionKey = (cid, encryptedKey) => {
    const storedKeys = JSON.parse(localStorage.getItem("encryptionKeys") || "{}");
    storedKeys[cid] = encryptedKey;
    localStorage.setItem("encryptionKeys", JSON.stringify(storedKeys));
  };

  return (
    <div className="upload-container">
      <h2>Upload Medical Record</h2>
      <div>
        <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.png,.txt,.docx" />
      </div>
      <div>
        <label>Master Password:</label>
        <input
          type="password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          disabled={isUploading}
        />
        <p>
          <em>Your master password is used to securely store your encryption keys.</em>
        </p>
      </div>
      <button onClick={handleUpload} disabled={isUploading || !masterPassword}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default UploadMedicalRecord;
