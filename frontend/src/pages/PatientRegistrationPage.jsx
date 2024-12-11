import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerPatient } from "../services/contractService";
import { create } from "ipfs-http-client";
import "../styles/PatientRegistration.css";

// Initialize IPFS client for local node
const ipfs = create({ host: "localhost", port: 5001, protocol: "http" });

const PatientRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    address: "",
    medicalHistory: "",
    contact: "",
  });
  const [errors, setErrors] = useState({});
  const [cid, setCid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Sanitize input to prevent potential injection attacks
  const sanitizeInput = (input) => input.replace(/[`'"\\;]/g, "");

  // Validate the date field (YYYY-MM-DD format)
  const validateDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date.match(dateRegex)) return false;
    return !isNaN(new Date(date).getTime());
  };

  // Validate all form fields and set error messages if needed
  const validateFields = () => {
    const newErrors = {};
    const sanitizedFormData = { ...formData };

    for (const [key, value] of Object.entries(formData)) {
      sanitizedFormData[key] = sanitizeInput(value);
      if (!value.trim()) {
        newErrors[key] = "This field is required.";
      }
    }

    if (formData.dob && !validateDate(formData.dob)) {
      newErrors.dob = "Please enter a valid date in YYYY-MM-DD format.";
    }

    setFormData(sanitizedFormData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes and format specific fields like 'contact'
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "contact" ? value.replace(/\D/g, "") : value;

    setFormData((prevData) => ({
      ...prevData,
      [name]: formattedValue,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    })); // Clear error for the field
  };

  // Upload patient data to IPFS and return CID
  const uploadToIPFS = async (data) => {
    try {
      console.log("[INFO] Uploading data to IPFS...");

      const encoder = new TextEncoder();
      const content = encoder.encode(JSON.stringify(data));

      // Generate a systematic file name based on the current date and time
      const now = new Date();
      const fileName = `patient-data--${now.toISOString().replace(/[:.]/g, "-")}.json`;
      const mfsPath = `/patient-data/${fileName}`;

      await ipfs.files.write(mfsPath, content, { create: true, parents: true });
      const stats = await ipfs.files.stat(mfsPath);
      console.log("[INFO] IPFS upload successful. CID:", stats.cid.toString());

      return stats.cid.toString();
    } catch (error) {
      console.error("[ERROR] IPFS upload failed:", error);
      throw new Error("Failed to upload data to IPFS.");
    }
  };

  // Handle patient registration process
  const handleRegisterPatient = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      setMessage("Please correct the errors before submitting.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setSuccessMessage("");

    try {
      // Upload data to IPFS
      const cid = await uploadToIPFS(formData);
      setCid(cid);

      // Register patient on the blockchain
      console.log("[INFO] Registering patient on blockchain...");
      await registerPatient(cid);

      setSuccessMessage("Patient registered successfully!");
      setTimeout(() => navigate("/patient/dashboard"), 2000);
    } catch (error) {
      console.error("[ERROR] Registration process failed:", error);
      setMessage(`${error} Please Try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <h1>Patient Registration</h1>
      <p>
        Submit your personal information to register. This data will be securely
        stored off-chain.
      </p>
      <form className="registration-form" onSubmit={handleRegisterPatient}>
        {["name", "dob", "address", "medicalHistory", "contact"].map((field) => (
          <div className="form-row" key={field}>
            <label>
              {field === "dob" ? "Date of Birth" : field.charAt(0).toUpperCase() + field.slice(1)}:
            </label>
            {field === "medicalHistory" ? (
              <textarea
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                required
              />
            ) : (
              <input
                type={field === "dob" ? "date" : "text"}
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
      {cid && <p>IPFS CID: {cid}</p>}
      {message && <p className="message">{message}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default PatientRegistration;
