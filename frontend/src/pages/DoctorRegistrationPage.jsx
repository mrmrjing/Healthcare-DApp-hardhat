  import React, { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { registerProvider } from "../services/contractService";
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
    const [privateKey, setPrivateKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [failureMessage, setFailureMessage] = useState("");
    const navigate = useNavigate();

    // Sanitize input to prevent potential security risks
    const sanitizeInput = (input) => input.replace(/[`'"\\;]/g, "");

    // Validate form fields and ensure they are not empty
    const validateFields = () => {
      const newErrors = {};
      const sanitizedFormData = { ...formData };

      for (const [key, value] of Object.entries(formData)) {
        sanitizedFormData[key] = sanitizeInput(value);
        if (!value.trim()) {
          newErrors[key] = "This field is required.";
        }
      }

      setFormData(sanitizedFormData);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Handle input changes and ensure proper formatting for specific fields
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      const updatedValue = name === "contact" ? value.replace(/\D/g, "") : value; // Numeric input for 'contact'
      setFormData((prevData) => ({
        ...prevData,
        [name]: updatedValue,
      }));
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" })); // Clear error for the field
    };

    // Upload data to IPFS and return the CID
    const uploadToIPFS = async (data) => {
      try {
        console.log("[INFO] Uploading data to IPFS...");
        const now = new Date();
        const encoder = new TextEncoder();
        const content = encoder.encode(JSON.stringify(data));
        const fileName = `doctor-data--${now.toISOString().replace(/[:.]/g, "-")}.json`;
        const mfsPath = `/doctor-data/${fileName}`;
        await ipfs.files.write(mfsPath, content, { create: true, parents: true });
        const stats = await ipfs.files.stat(mfsPath);
        console.log("[INFO] IPFS Upload Successful:", stats.cid.toString());
        return stats.cid.toString();
      } catch (error) {
        console.error("[ERROR] Failed to upload to IPFS:", error);
        throw new Error("Failed to upload data to IPFS");
      }
    };

    // Handle the registration process
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

        // Step 2: Generate a key pair using ethers.js
        const wallet = ethers.Wallet.createRandom();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.publicKey;
        setPrivateKey(privateKey); // Display private key

        console.log("[INFO] Generated Keys - Public Key:", publicKey, "Private Key:", privateKey);

        // Step 3: Convert public key to bytes for blockchain
        const publicKeyBytes = ethers.getBytes(publicKey);

        // Step 4: Register the doctor on the blockchain
        console.log("[INFO] Registering doctor on the blockchain...");
        const tx = await registerProvider(cid, publicKeyBytes);
        console.log("[INFO] Blockchain transaction successful:", tx);

        // Step 5: Notify the user of success
        setSuccessMessage("Doctor registered successfully!");
        setTimeout(() => {
          navigate("/doctor/request-access", { replace: true });
        }, 10000);
      } catch (error) {
        console.error("[ERROR] Registration failed:", error);

        const errorMessage =
          error.code === 4001
            ? "Transaction rejected by the user."
            : error.message.includes("gas")
            ? "Transaction failed due to insufficient gas."
            : error.message.includes("Patient")
            ? String(error)
            : "An error occurred during registration. Please try again.";
        setFailureMessage(errorMessage);
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
          {["name", "specialization", "email", "contact", "qualifications"].map((field) => (
            <div className="form-row" key={field}>
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
              {field === "qualifications" ? (
                <textarea
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  required
                />
              ) : (
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  required
                />
              )}
              {errors[field] && <p className="error">{errors[field]}</p>}
            </div>
          ))}
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
                  <strong>Warning:</strong> Save this private key securely. It cannot be retrieved later.
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
