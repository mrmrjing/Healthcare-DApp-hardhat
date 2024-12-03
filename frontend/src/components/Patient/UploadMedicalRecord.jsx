import React, { useState } from "react";
import { uploadMedicalRecord } from "../../services/contractService";
import { create } from "ipfs-http-client";
import CryptoJS from "crypto-js";

// Initialize IPFS client for local node
const ipfs = create({ url: "http://localhost:5001/api/v0" });

const UploadMedicalRecord = ({ patientAddress, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null); // Clear previous errors when a new file is selected
    setSuccessMessage(null); // Clear success message when a new file is selected
  };

  // Generate a symmetric key using MetaMask
  const generateSymmetricKey = async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const userAddress = accounts[0];

    // Sign a unique message
    const message = "EncryptionKeyDerivation:" + new Date().toISOString();
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, userAddress],
    });

    // Derive a symmetric key from the signature
    const hash = CryptoJS.SHA256(signature).toString(CryptoJS.enc.Hex);
    return hash; // Use this hash as the symmetric key
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

          const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });

          const encryptedBase64 = encrypted.toString(); // Encrypted file as Base64 string
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
      return cid;
    } catch (error) {
      console.error("[ERROR] IPFS upload failed:", error);
      throw error;
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setError(null);
    setSuccessMessage(null); // Clear previous success messages
    setIsUploading(true);

    try {
      // Step 1: Generate a symmetric key using MetaMask
      const symmetricKey = await generateSymmetricKey();
      console.log("[INFO] Derived Symmetric Key (Hex):", symmetricKey);

      // Step 2: Encrypt the file
      const encryptedFile = await encryptFile(file, symmetricKey);

      // Step 3: Upload the encrypted file to IPFS
      const cid = await uploadToIPFS(encryptedFile);
      console.log("[INFO] File uploaded to IPFS. CID:", cid);

      // Step 4: Record the CID on the blockchain
      await uploadMedicalRecord(patientAddress, cid);
      console.log("[INFO] Medical record successfully stored on blockchain.");

      // Step 5: Display success message
      setSuccessMessage("Medical record successfully uploaded!");

      // Reset the form and notify success
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("[ERROR] Error uploading medical record:", err);
      setError("Failed to upload medical record. Please try again.");
    } finally {
      setIsUploading(false);
    }
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
      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>} 
    </div>
  );
};

export default UploadMedicalRecord;
