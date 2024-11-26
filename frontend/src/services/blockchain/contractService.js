import { BrowserProvider, Contract } from "ethers";
import deployedAddresses from "../../artifacts/deployedAddresses.json";
import AccessControlABI from "../../artifacts/contracts/AccessControl.sol/AccessControl.json";
import HealthcareProviderRegistryABI from "../../artifacts/contracts/HealthcareProviderRegistry.sol/HealthcareProviderRegistry.json";
import MedicalRecordsABI from "../../artifacts/contracts/MedicalRecords.sol/MedicalRecords.json";
import PatientRegistryABI from "../../artifacts/contracts/PatientRegistry.sol/PatientRegistry.json";

// Contract Addresses
const CONTRACT_ADDRESSES = {
  accessControl: deployedAddresses.AccessControl,
  healthcareProviderRegistry: deployedAddresses.HealthcareProviderRegistry,
  medicalRecords: deployedAddresses.MedicalRecords,
  patientRegistry: deployedAddresses.PatientRegistry,
};

// Get the provider wrapping MetaMask's window.ethereum
const getProvider = async () => {
  if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed. Please install MetaMask to use this application.");
  }

  // Create a new BrowserProvider
  return new BrowserProvider(window.ethereum);
};

// Get the signer for transactions
const getSigner = async () => {
  const provider = await getProvider();
  return provider.getSigner();
};

// Get Contract Instance
export const getContract = async (contractName) => {
  const signer = await getSigner();
  let abi, address;

  switch (contractName) {
    case "patientRegistry":
      abi = PatientRegistryABI.abi;
      address = CONTRACT_ADDRESSES.patientRegistry;
      break;
    case "accessControl":
      abi = AccessControlABI.abi;
      address = CONTRACT_ADDRESSES.accessControl;
      break;
    case "healthcareProviderRegistry":
      abi = HealthcareProviderRegistryABI.abi;
      address = CONTRACT_ADDRESSES.healthcareProviderRegistry;
      break;
    case "medicalRecords":
      abi = MedicalRecordsABI.abi;
      address = CONTRACT_ADDRESSES.medicalRecords;
      break;
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }

  // Use the provider for read-only calls and signer for transactions
  return new Contract(address, abi, signer); // Use signer for write-enabled interactions
};


// Core functions to interact with the blockchain

// Allows a verified provider to request access to a patient’s data.
export const requestAccess = async (patientAddress, purposeHash) => {
    try {
      const accessControl = await getContract("accessControl");
      const tx = await accessControl.requestAccess(patientAddress, purposeHash);
      await tx.wait();
      console.log("Access request sent.");
    } catch (error) {
      console.error("Error requesting access:", error);
    }
  };
  
// Enables a registered patient to approve access for a provider.
export const approveAccess = async (providerAddress) => {
  try {
    const accessControl = await getContract("accessControl");
    const tx = await accessControl.approveAccess(providerAddress);
    await tx.wait();
    console.log("Access approved.");
  } catch (error) {
    console.error("Error approving access:", error);
  }
};

// Allows a registered patient to revoke access from a provider.
export const revokeAccess = async (providerAddress) => {
    try {
      const accessControl = await getContract("accessControl");
      const tx = await accessControl.revokeAccess(providerAddress);
      await tx.wait();
      console.log("Access revoked.");
    } catch (error) {
      console.error("Error revoking access:", error);
    }
  };

// Checks if a provider has access to a patient's data.
export const checkAccess = async (patientAddress, providerAddress) => {
    try {
      const accessControl = await getContract("accessControl");
      const hasAccess = await accessControl.checkAccess(patientAddress, providerAddress);
      return hasAccess;
    } catch (error) {
      console.error("Error checking access:", error);
    }
  };

// Allows a provider to register themselves with a data CID.
export const registerProvider = async (dataCID) => {
  try {
    const registry = await getContract("healthcareProviderRegistry");
    const tx = await registry.registerHealthcareProvider(dataCID);
    await tx.wait(); // Wait for transaction confirmation
    console.log("Provider registered successfully.");
    return tx; // Return the transaction receipt for further processing
  } catch (error) {
    console.error("Error registering provider:", error);
    throw error; // Rethrow the error so the caller can handle it
  }
};


// Enables the admin to verify a registered provider.
export const verifyProvider = async (providerAddress) => {
    try {
      const registry = await getContract("healthcareProviderRegistry");
      const tx = await registry.verifyHealthcareProvider(providerAddress);
      await tx.wait();
      console.log("Provider verified.");
    } catch (error) {
      console.error("Error verifying provider:", error);
    }
  };

// Checks if a provider is verified.
export const isProviderVerified = async (providerAddress) => {
    try {
      const registry = await getContract("healthcareProviderRegistry");
      const isVerified = await registry.isProviderVerified(providerAddress);
      return isVerified;
    } catch (error) {
      console.error("Error checking provider verification:", error);
    }
  };

// Allows authorized users to upload a medical record for a patient.
export const uploadMedicalRecord = async (patientAddress, encryptedCID) => {
    try {
      const medicalRecords = await getContract("medicalRecords");
      const tx = await medicalRecords.uploadMedicalRecord(patientAddress, encryptedCID);
      await tx.wait();
      console.log("Medical record uploaded.");
    } catch (error) {
      console.error("Error uploading medical record:", error);
    }
  };

// Fetches all medical records for the calling patient.
export const getMyMedicalRecords = async () => {
    try {
      const medicalRecords = await getContract("medicalRecords");
      const records = await medicalRecords.getMedicalRecords();
      return records;
    } catch (error) {
      console.error("Error fetching medical records:", error);
    }
  };

// Fetches all medical records for a specific patient, if authorized.
export const getPatientRecords = async (patientAddress) => {
    try {
      const medicalRecords = await getContract("medicalRecords");
      const records = await medicalRecords.getPatientRecords(patientAddress);
      return records;
    } catch (error) {
      console.error("Error fetching patient records:", error);
    }
  };

// Allows a user to register as a patient with their data CID.
export const registerPatient = async (dataCID) => {
  try {
    const patientRegistry = await getContract("patientRegistry");
    console.log("Registering patient with CID:", dataCID);
    const tx = await patientRegistry.registerPatient(dataCID);
    await tx.wait(); // Wait for transaction confirmation
    console.log("Patient registered successfully.");
    return tx; // Return the transaction receipt for additional processing, if needed
  } catch (error) {
    console.error("Error registering patient:", error);
    throw error; // Rethrow the error so the caller can handle it
  }
};


// Enables a patient to grant access to their data to a provider.
export const grantAccessToProvider = async (providerAddress) => {
    try {
      const patientRegistry = await getContract("patientRegistry");
      const tx = await patientRegistry.grantAccess(providerAddress);
      await tx.wait();
      console.log("Access granted to provider.");
    } catch (error) {
      console.error("Error granting access:", error);
    }
  };

// Allows a patient to revoke access from a provider.
export const revokeAccessFromProvider = async (providerAddress) => {
    try {
      const patientRegistry = await getContract("patientRegistry");
      const tx = await patientRegistry.revokeAccess(providerAddress);
      await tx.wait();
      console.log("Access revoked from provider.");
    } catch (error) {
      console.error("Error revoking access:", error);
    }
  };

// Checks if a provider is authorized for a specific patient.
export const isAuthorized = async (patientAddress, providerAddress) => {
    try {
      const patientRegistry = await getContract("patientRegistry");
      const isAuthorized = await patientRegistry.isAuthorized(patientAddress, providerAddress);
      return isAuthorized;
    } catch (error) {
      console.error("Error checking authorization:", error);
    }
  };
  
// Checks if a provider is registered 
export const isProviderRegistered = async (providerAddress) => {
  try {
    const registry = await getContract("healthcareProviderRegistry");
    const isRegistered = await registry.isProviderRegistered(providerAddress);
    return isRegistered;
  } catch (error) {
    console.error("Error checking provider registration:", error);
    return false; 
  }
};

// Checks if a patient is registered
export const isPatientRegistered = async (patientAddress) => {
  try {
    const patientRegistry = await getContract("patientRegistry");
    const isRegistered = await patientRegistry.isPatientRegistered(patientAddress);
    return isRegistered;
  } catch (error) {
    console.error("Error checking patient registration:", error);
    return false; 
  }
};

// Method to get all registered providers
export const getAllProviders = async () => {
  try {
    const registry = await getContract("healthcareProviderRegistry");
    const providers = await registry.getAllProviders();
    return providers;
  } catch (error) {
    console.error("Error fetching providers:", error);
    return [];
  }
}


 

  