import React, { useState } from "react";
import { uploadMedicalRecord } from "../../services/contractService";
import { create } from "ipfs-http-client";
import CryptoJS from "crypto-js";

// Initialize IPFS client for local node
const ipfs = create({ url: "http://localhost:5001/api/v0" });

const UploadMedicalRecord = ({ patientAddress, onUploadSuccess, changeTab }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [masterPassword, setMasterPassword] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null); // Clear previous errors when a new file is selected
  };

  // Handle file upload
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
      // Step 1: Derive symmetric key from master password
      const symmetricKey = deriveKey(masterPassword);
      console.log("[INFO] Derived Symmetric Key (Hex):", symmetricKey.toString(CryptoJS.enc.Hex));

      // Step 2: Encrypt the file
      const encryptedFile = await encryptFile(file, symmetricKey);

      // Step 3: Upload the encrypted file to IPFS
      const cid = await uploadToIPFS(encryptedFile);
      console.log("[INFO] File uploaded to IPFS. CID:", cid);

      // Step 4: Encrypt the symmetric key with the master password
      const encryptedKey = CryptoJS.AES.encrypt(symmetricKey, masterPassword).toString();

      // Step 5: Save CID and encrypted key locally
      saveEncryptionKey(cid, encryptedKey);

      // Step 6: Record the CID on the blockchain
      await uploadMedicalRecord(patientAddress, cid);
      console.log("[INFO] Medical record successfully stored on blockchain.");

      // Reset the form and notify success
      setFile(null);
      setMasterPassword("");
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("[ERROR] Error uploading medical record:", err);
      setError("Failed to upload medical record. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Derive a symmetric key using the master password
  const deriveKey = (password) => {
    const salt = CryptoJS.enc.Hex.parse("a9b8c7d6e5f4a3b2"); // Static salt (should be dynamic in production)
    return CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 });
  };

  // Encrypt file data using AES encryption
  const encryptFile = (file, key) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileData = new Uint8Array(reader.result);
          const wordArray = CryptoJS.lib.WordArray.create(fileData);
          const iv = CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f"); // Static IV (replace with dynamic in production)

          console.log("[DEBUG] Symmetric key (Hex):", key.toString(CryptoJS.enc.Hex));

          const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });

          const encryptedBase64 = encrypted.toString(); // Encrypted file as Base64 string
          console.log("[DEBUG] Encrypted file preview (Base64):", encryptedBase64.slice(0, 100));
          resolve(encryptedBase64);
        } catch (encryptionError) {
          reject(encryptionError);
        }
      };

      reader.onerror = (readError) => {
        console.error("[ERROR] File reading failed:", readError);
        reject(readError);
      };

      reader.readAsArrayBuffer(file); // Read file as binary data
    });
  };

  // Upload encrypted file to IPFS
  const uploadToIPFS = async (encryptedFile) => {
    try {
      console.log("[INFO] Uploading encrypted file to IPFS...");
      const result = await ipfs.add(encryptedFile);
      const cid = result.cid.toString(); // Convert CID to string for storage
      console.log("[INFO] Encrypted file successfully uploaded to IPFS. CID:", cid);
      if (cid){
        changeTab('records')
      }
      return cid;
    } catch (error) {
      console.error("[ERROR] IPFS upload failed:", error);
      throw error;
    }
  };

  // Save the encrypted key locally
  const saveEncryptionKey = (cid, encryptedKey) => {
    console.log("[INFO] Saving encrypted key locally...");
    const storedKeys = JSON.parse(localStorage.getItem("encryptionKeys") || "{}");
    storedKeys[cid] = encryptedKey;
    localStorage.setItem("encryptionKeys", JSON.stringify(storedKeys));
  };

  return (
    <div className="upload-container">
      <h2>Upload Medical Record</h2>
      <div>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.png,.txt,.docx"
          disabled={isUploading}
        />
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
