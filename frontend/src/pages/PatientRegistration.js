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
      newErrors.dob = "Please enter a valid date in YYYY-MM-DD format.";
    }

    setFormData(sanitizedFormData);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const uploadToIPFS = async (data) => {
    try {
      const result = await ipfs.add(JSON.stringify(data), { pin: true });
      console.log("Data pinned with CID:", result.cid.toString());
      return result.cid.toString();
    } catch (error) {
      console.error("IPFS upload error:", error.message);
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

    try {
      const cid = await uploadToIPFS(formData);

      if (!cid) {
        setMessage("Failed to upload data to IPFS.");
        setIsLoading(false);
        return;
      }

      console.log("Uploaded to IPFS. CID:", cid);

      setCid(cid);

      // Call the smart contract service to register the patient
      await registerPatient(cid);

      setMessage("Patient registered successfully!");
      setIsLoading(false);
      navigate("/patient/dashboard");
    } catch (error) {
      console.error("Registration error:", error.message);
      setMessage("An error occurred during registration. Please try again.");
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
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
      {cid && <p>IPFS CID: {cid}</p>}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default PatientRegistration;
