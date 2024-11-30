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
  const [encryptionKey, setEncryptionKey] = useState(""); // Generated encryption key

  // Generate encryption key
  const generateEncryptionKey = () => {
    const key = CryptoJS.lib.WordArray.random(256 / 8).toString(); // 256-bit key
    setEncryptionKey(key);
    console.log("Generated Encryption Key:", key);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    if (!encryptionKey) {
      setError("Encryption key is missing. Please generate a key.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Encrypt the file
      const encryptedFile = await encryptFile(file, encryptionKey);

      // Create a systematic file name
      const now = new Date();
      const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}_${file.name}`;

      // Define MFS path
      const mfsPath = `/medical-records/${fileName}`;

      // Write encrypted file to IPFS MFS
      await ipfs.files.write(mfsPath, encryptedFile, { create: true, parents: true });

      // Get CID from the MFS path
      const stats = await ipfs.files.stat(mfsPath);
      const cid = stats.cid.toString();

      console.log("File uploaded to IPFS, CID:", cid);

      // Upload CID to blockchain
      await uploadMedicalRecord(patientAddress, cid);

      console.log("Medical record stored on blockchain.");
      setFile(null);
      setEncryptionKey("");
      if (onUploadSuccess) onUploadSuccess(); 
    } catch (err) {
      console.error("Error uploading medical record:", err);
      setError("Failed to upload medical record. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const encryptFile = (file, key) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileData = new Uint8Array(reader.result); // Convert ArrayBuffer to Uint8Array
          const wordArray = CryptoJS.lib.WordArray.create(fileData); // Create WordArray from Uint8Array
          const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString(); // Encrypt file data
  
          // Convert the encrypted string back to binary format (ArrayBuffer)
          const encryptedBuffer = new TextEncoder().encode(encrypted); // Encrypted binary data
          resolve(encryptedBuffer); // Pass binary data to IPFS
        } catch (encryptionError) {
          reject(encryptionError);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file); // Read file as ArrayBuffer
    });
  };
  
  
  

  return (
    <div className="upload-container">
      <h2>Upload Medical Record</h2>
      <div>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.png,.txt,.docx"
        />
      </div>
      <div>
        <button onClick={generateEncryptionKey} disabled={isUploading}>
          Generate Encryption Key
        </button>
        {encryptionKey && (
          <p>
            <strong>Encryption Key:</strong> {encryptionKey} <br />
            <em style={{ color: "red" }}>
              Save this key! You will need it to decrypt your file.
            </em>
          </p>
        )}
      </div>
      <div>
        <button onClick={handleUpload} disabled={isUploading || !encryptionKey}>
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default UploadMedicalRecord;
