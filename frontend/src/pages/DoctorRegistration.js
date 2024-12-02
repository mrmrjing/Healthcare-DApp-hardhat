import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerProvider } from "../services/blockchain/contractService";
import { create } from "ipfs-http-client";
import "../styles/DoctorRegistration.css";

// Initialize IPFS client for local node
const ipfs = create({ host: "localhost", port: 5001, protocol: "http" });

const ethers = require("ethers");

const DoctorRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    email: "",
    contact: "",
    qualifications: "",
  });
  const [errors, setErrors] = useState({});
  const [cid, setCid] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [failureMessage, setFailureMessage] = useState("");
  const navigate = useNavigate();

  const sanitizeInput = (input) => {
    const sqlInjectionRegex = /[`'"\\;]/g; // Matches harmful characters like ` ' " ; \
    return input.replace(sqlInjectionRegex, "");
  };

  const validateFields = () => {
    const newErrors = {};
    const sanitizedFormData = { ...formData };

    Object.keys(formData).forEach((key) => {
      sanitizedFormData[key] = sanitizeInput(formData[key]);
      if (!formData[key]) {
        newErrors[key] = "This field is required.";
      }
    });

    setFormData(sanitizedFormData);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If the field is 'contact', ensure only numeric input
    if (name === "contact") {
      const numericValue = value.replace(/\D/g, ""); // Remove non-numeric characters
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const uploadToIPFS = async (data) => {
    try {
      console.log("Uploading to IPFS...");

      // Convert data to Uint8Array using TextEncoder
      const encoder = new TextEncoder();
      const content = encoder.encode(JSON.stringify(data));

      // Write data to MFS
      const fileName = `doctor-data-${Date.now()}.json`;
      const mfsPath = `/doctor-data/${fileName}`;
      await ipfs.files.write(mfsPath, content, { create: true, parents: true });

      // Get the CID of the file
      const stats = await ipfs.files.stat(mfsPath);
      console.log("IPFS Upload Result:", stats);

      return stats.cid.toString();
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw new Error("Failed to upload data to IPFS");
    }
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      setFailureMessage("Please correct the errors before submitting.");
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setFailureMessage("");

    try {
      // Step 1: Upload data to IPFS
      const cid = await uploadToIPFS(formData);
      setCid(cid);

      // Step 2: Generate a key pair using ethers.js Wallet
      const wallet = ethers.Wallet.createRandom();
      const privateKey = wallet.privateKey; // Doctor's private key
      setPrivateKey(privateKey); // Display private key on the screen

      const publicKey = wallet.publicKey; // Doctor's public key 
      console.log("[DEBUG] Doctor's Public Key (Hex):", publicKey);
      console.log("[DEBUG] Doctor's Private Key:", privateKey);

      // Step 3: Store the private key securely
      localStorage.setItem("providerPrivateKey", privateKey);
      console.log("Private Key stored securely.");

      // Step 4: Convert public key to bytes for blockchain
      const publicKeyBytes = ethers.getBytes(publicKey);
      console.log("Public Key Bytes:", publicKeyBytes);

      // Step 5: Register the provider on the blockchain, including the public key
      const tx = await registerProvider(cid, publicKeyBytes);

      // Step 6: If successful, set the success message
      setSuccessMessage("Doctor registered successfully!");
      setFailureMessage("");
      console.log("Transaction details:", tx);

      // Redirect to doctor dashboard after a short delay
      setTimeout(() => {
        navigate("/doctor/request-access", { replace: true });
      }, 10000);
    } catch (error) {
      console.error("Registration failed:", error);

      if (error.code === 4001) {
        setFailureMessage("Transaction rejected by the user. Please try again.");
      } else if (error.message && error.message.includes("gas")) {
        setFailureMessage("Transaction failed due to insufficient gas.");
      } else {
        setFailureMessage("An error occurred during registration. Please try again.");
      }

      setSuccessMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <h1>Doctor Registration</h1>
      <p>
        Submit your professional information to register. This data will be securely stored off-chain.
      </p>
      <form className="registration-form" onSubmit={handleRegisterDoctor}>
        <div className="form-row">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          {errors.name && <p className="error">{errors.name}</p>}
        </div>
        <div className="form-row">
          <label>Specialization:</label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            required
          />
          {errors.specialization && <p className="error">{errors.specialization}</p>}
        </div>
        <div className="form-row">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>
        <div className="form-row">
          <label>Contact Number:</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            required
          />
          {errors.contact && <p className="error">{errors.contact}</p>}
        </div>
        <div className="form-row">
          <label>Qualifications:</label>
          <textarea
            name="qualifications"
            value={formData.qualifications}
            onChange={handleInputChange}
            required
          />
          {errors.qualifications && <p className="error">{errors.qualifications}</p>}
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? <span className="spinner"></span> : "Register"}
        </button>
      </form>

      {/* Display success or failure messages */}
      {successMessage && (
        <div className="message-container">
          <p className="success-message">{successMessage}</p>
          {privateKey && (
            <div className="private-key-container">
              <p><strong>Private Key:</strong> {privateKey}</p>
              <p className="warning">
                <strong>Warning:</strong> Please save this private key securely. You will not be able to retrieve it later.
              </p>
            </div>
          )}
        </div>
      )}
      {failureMessage && (
        <div className="message-container">
          <p className="failure-message">{failureMessage}</p>
        </div>
      )}
    </div>
  );
};

export default DoctorRegistration;
