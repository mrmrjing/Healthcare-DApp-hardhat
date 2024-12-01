import React, { useState, useContext } from "react";
import { requestAccess, getEncryptedKey } from "../services/blockchain/contractService";
import { AuthContext } from "../contexts/AuthContext"; // Import AuthContext
const { isAddress, keccak256, toUtf8Bytes, constants } = require("ethers");
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
      setMessage("");

      if (!retrieveAddress || !isAddress(retrieveAddress)) {
        setMessage("Please enter a valid patient address to retrieve the key.");
        return;
      }

      if (!privateKey) {
        setMessage("Please provide your private key for decryption.");
        return;
      }

      const encryptedKey = await getEncryptedKey(constants.AddressZero, retrieveAddress);
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

      <button onClick={logout} style={{ marginTop: "20px", backgroundColor: "red", color: "white" }}>
        Log Out
      </button>
    </div>
  );
};

const decryptKey = (encryptedKeyJSON, privateKeyHex) => {
  try {
    const encryptedKeyObject = JSON.parse(encryptedKeyJSON);
    const { ephemeralPublicKey, encryptedSymmetricKey } = encryptedKeyObject;

    const ec = new EC("secp256k1");
    const providerPrivateKey = ec.keyFromPrivate(privateKeyHex, "hex");
    const ephemeralKey = ec.keyFromPublic(ephemeralPublicKey, "hex");
    const sharedSecret = providerPrivateKey.derive(ephemeralKey.getPublic());
    const aesKey = CryptoJS.SHA256(sharedSecret.toString(16)).toString();

    const decryptedBytes = CryptoJS.AES.decrypt(encryptedSymmetricKey, aesKey);
    const decryptedSymmetricKey = decryptedBytes.toString(CryptoJS.enc.Utf8);

    return decryptedSymmetricKey;
  } catch (error) {
    console.error("Error decrypting key:", error);
    throw new Error("Failed to decrypt the key. Ensure the private key is correct.");
  }
};

export default RequestAccessPage;
