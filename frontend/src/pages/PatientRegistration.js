import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerPatient } from "../services/blockchain/contractService";
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

  const sanitizeInput = (input) => {
    const sqlInjectionRegex = /[`'"\\;]/g; // Matches harmful characters like ` ' " ; \
    return input.replace(sqlInjectionRegex, "");
  };

  const validateDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD
    if (!date.match(dateRegex)) return false;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()); // Ensures it's a valid date
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

    if (formData.dob && !validateDate(formData.dob)) {
      newErrors.dob = "Please enter a valid date in DD-MM-YYYY format.";
    }

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
  
      // Convert data to a Uint8Array using TextEncoder
      const encoder = new TextEncoder();
      const content = encoder.encode(JSON.stringify(data));
  
      // Create a systematic file name based on the current date and time
      const now = new Date();
      const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.json`;
  
      // Define the MFS path with the systematic file name
      const mfsPath = `/patient-data/${fileName}`;
  
      // Write data to MFS
      await ipfs.files.write(mfsPath, content, { create: true, parents: true });
  
      // Get the CID of the file in MFS
      const stats = await ipfs.files.stat(mfsPath);
      console.log("IPFS Upload Result:", stats);
  
      return stats.cid.toString();
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw new Error("Failed to upload data to IPFS");
    }
  };
  

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
      const cid = await uploadToIPFS(formData);
      setCid(cid);
  
      await registerPatient(cid);
  
      setSuccessMessage("Patient registered successfully!");
      setMessage("");
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error during registration process:", error);
      setMessage("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  

  return (
    <div className="registration-page">
      <h1>Patient Registration</h1>
      <p>Submit your personal information to register. This data will be securely stored off-chain.</p>
      <form className="registration-form" onSubmit={handleRegisterPatient}>
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
          <label>Date of Birth:</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleInputChange}
            required
          />
          {errors.dob && <p className="error">{errors.dob}</p>}
        </div>
        <div className="form-row">
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          {errors.address && <p className="error">{errors.address}</p>}
        </div>
        <div className="form-row">
          <label>Medical History:</label>
          <textarea
            name="medicalHistory"
            value={formData.medicalHistory}
            onChange={handleInputChange}
            required
          />
          {errors.medicalHistory && <p className="error">{errors.medicalHistory}</p>}
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
