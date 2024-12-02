import {
  BrowserProvider,
  Contract,
  toUtf8Bytes,
  toUtf8String, 
} from "ethers";
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
    throw new Error(
      "MetaMask is not installed. Please install MetaMask to use this application."
    );
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
export const requestAccess = async (patientAddress, plainTextPurpose) => {
  try {
    const accessControl = await getContract("accessControl");

    console.log("Calling requestAccess on blockchain with:");
    console.log("Patient Address:", patientAddress);
    console.log("Plain Text Purpose:", plainTextPurpose);

    const tx = await accessControl.requestAccess(patientAddress, plainTextPurpose);
    // const tx = await accessControl.requestAccess(patientAddress, "Medical History Access");

    await tx.wait();

    console.log("Access request sent successfully.");
  } catch (error) {
    console.error("[ERROR] Error requesting access:", error);
    throw error;
  }
};

// Enables a registered patient to approve access for a provider.
export const approveAccess = async (providerAddress, encryptedKey, cid) => {
  try {
    const accessControl = await getContract("accessControl");

    // Pass the encryptedKey to the smart contract
    const tx = await accessControl.approveAccess(providerAddress, encryptedKey, cid);
    await tx.wait();
    console.log("Access approved with encrypted key and CID.");
  } catch (error) {
    console.error("Error approving access:", error);
    throw error;
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
    const hasAccess = await accessControl.checkAccess(
      patientAddress,
      providerAddress
    );
    return hasAccess;
  } catch (error) {
    console.error("Error checking access:", error);
  }
};

// Allows a provider to register themselves with a data CID.
export const registerProvider = async (dataCID, publicKeyBytes) => {
  try {
    const registry = await getContract("healthcareProviderRegistry");

    // Pass both dataCID and publicKeyBytes to the contract method
    const tx = await registry.registerHealthcareProvider(dataCID, publicKeyBytes);
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
    return true; // Return true on success
  } catch (error) {
    console.error("Error verifying provider:", error);
    return false; // Return false on failure
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
export const uploadMedicalRecord = async (patientAddress, CID) => {
  try {
    const medicalRecords = await getContract("medicalRecords");

    console.log("Uploading medical record with CID:", CID);

    const tx = await medicalRecords.uploadMedicalRecord(patientAddress, CID);
    await tx.wait();
    console.log("Medical record uploaded successfully.");
  } catch (error) {
    console.error("Error uploading medical record:", error);
    throw error;
  }
};

// Fetches all medical records for the calling patient.
export const getMyMedicalRecords = async () => {
  try {
    const medicalRecords = await getContract("medicalRecords");
    const records = await medicalRecords.getMedicalRecords();

    return records.map((record) => {
      let timestamp;

      if (typeof record.timestamp === "bigint") {
        timestamp = Number(record.timestamp); // Convert BigInt to Number
      } else if (record.timestamp && typeof record.timestamp.toNumber === "function") {
        timestamp = record.timestamp.toNumber();
      } else if (typeof record.timestamp === "string" || typeof record.timestamp === "number") {
        timestamp = Number(record.timestamp);
      } else {
        console.error("Unexpected timestamp format:", record.timestamp);
        throw new Error("Unexpected timestamp format");
      }

      return {
        CID: record.CID,
        timestamp: new Date(timestamp * 1000).toLocaleString(),
      };
    });
  } catch (error) {
    console.error("Error fetching medical records:", error.message);
    return [];
  }
};

// Fetches all medical records for a specific patient, if authorized.
export const getPatientRecords = async (patientAddress) => {
  try {
    const medicalRecords = await getContract("medicalRecords");
    const records = await medicalRecords.getPatientRecords(patientAddress);

    return records.map((record) => {
      let timestamp;

      if (typeof record.timestamp === "bigint") {
        timestamp = Number(record.timestamp); // Convert BigInt to Number
      } else if (record.timestamp && typeof record.timestamp.toNumber === "function") {
        timestamp = record.timestamp.toNumber();
      } else if (typeof record.timestamp === "string" || typeof record.timestamp === "number") {
        timestamp = Number(record.timestamp);
      } else {
        console.error("Unexpected timestamp format:", record.timestamp);
        throw new Error("Unexpected timestamp format");
      }

      return {
        CID: record.CID,
        timestamp: new Date(timestamp * 1000).toLocaleString(),
      };
    });
  } catch (error) {
    console.error("Error fetching patient records:", error.message);
    return [];
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
    const isAuthorized = await patientRegistry.isAuthorized(
      patientAddress,
      providerAddress
    );
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

// Checks if a provider is rejected
export const isProviderRejected = async (providerAddress) => {
  try {
    const registry = await getContract("healthcareProviderRegistry");
    const isRejected = await registry.isProviderRejected(providerAddress);
    return isRejected;
  } catch (error) {
    console.error("Error checking provider rejection:", error);
    return false;
  }
};

// Checks if a patient is registered
export const isPatientRegistered = async (patientAddress) => {
  try {
    const patientRegistry = await getContract("patientRegistry");
    const isRegistered = await patientRegistry.isPatientRegistered(
      patientAddress
    );
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
};

// Method to get the events emitted by the HealthcareProviderRegistry contract
export const getProviderRegistryEvents = async () => {
  try {
    const registry = await getContract("healthcareProviderRegistry");

    // Fetch events for registered providers
    const registeredFilter = registry.filters.ProviderRegistered();
    const registeredEvents = await registry.queryFilter(registeredFilter, 0);

    // Parse event data
    const parsedEvents = await Promise.all(
      registeredEvents.map(async (event) => {
        const providerAddress = event.args.providerAddress;
        const dataCID = event.args.dataCID; // CID is already a string
        const publicKey = event.args.publicKey; // Public key as bytes or hex

        console.log("Provider Address:", providerAddress);
        console.log("CID:", dataCID);
        console.log("Public Key:", publicKey);

        const isRejected = await registry.isProviderRejected(providerAddress);
        const isVerified = await registry.isProviderVerified(providerAddress);

        return {
          address: providerAddress,
          dataCID, // Directly use the string CID
          publicKey, // Include public key if needed
          isRejected,
          isVerified,
        };
      })
    );

    return parsedEvents;
  } catch (error) {
    console.error("Error fetching provider registry events:", error);
    return [];
  }
};

// Method to reject a provider verification request
export const rejectProvider = async (providerAddress) => {
  try {
    const registry = await getContract("healthcareProviderRegistry");
    const tx = await registry.rejectHealthcareProvider(providerAddress);
    await tx.wait();
    console.log("Provider rejected.");
    return true;
  } catch (error) {
    console.error("Error rejecting provider:", error);
    return false;
  }
};

// Method to get a provider's public key
export const getProviderPublicKey = async (providerAddress) => {
  try {
    const registry = await getContract("healthcareProviderRegistry");
    const publicKey = await registry.getProviderPublicKey(providerAddress);
    return publicKey; 
  } catch (error) {
    console.error("Error fetching provider public key:", error);
    throw error;
  }
};

// Method to retrieve the encrypted key for a specific provider-patient pair 
export const getEncryptedKey = async (providerAddress, patientAddress) => {
  try {
    const accessControl = await getContract("accessControl");

    // Fetch the encrypted key from the blockchain
    const encryptedKey = await accessControl.getEncryptedKey(providerAddress, patientAddress);
    return encryptedKey; // Returns the encrypted key as a string
  } catch (error) {
    console.error("Error retrieving encrypted key from blockchain:", error);
    throw error;
  }
};

// Method to retrieve access requests for a specific patient 
export const fetchPendingRequests = async (patientAddress) => {
  try {
    const accessControl = await getContract("accessControl");

    console.log("[DEBUG] Fetching pending requests for patient:", patientAddress);

    // Fetch all AccessRequested events
    const events = await accessControl.queryFilter(
      accessControl.filters.AccessRequested(patientAddress)
    );

    console.log("[DEBUG] AccessRequested events fetched:", events);

    // Map through events
    const pendingRequests = events.map((event, index) => {
      console.log(`[DEBUG] Event ${index} raw data:`, event);

      // Extract event arguments
      const { providerAddress, purposeHash, plainTextPurpose, cid } = event.args;

      console.log(`[DEBUG] Event ${index} - Provider Address:`, providerAddress);
      console.log(`[DEBUG] Event ${index} - Purpose Hash:`, purposeHash);
      console.log(`[DEBUG] Event ${index} - Plain Text Purpose:`, plainTextPurpose);
      console.log(`[DEBUG] Event ${index} - Type of Plain Text Purpose:`, typeof plainTextPurpose);

      return {
        doctorAddress: providerAddress,
        purposeHash,
        plainTextPurpose: plainTextPurpose || "Purpose not available", 
        cid,
      };
    });

    console.log("[DEBUG] Structured pending requests:", pendingRequests);

    return pendingRequests;
  } catch (error) {
    console.error("[ERROR] Error fetching pending requests:", error);
    return [];
  }
};

export const getAuthorizedCIDs = async (providerAddress, patientAddress) => {
  try {
      const accessControl = await getContract("accessControl");
      const cid = await accessControl.getAuthorizedCIDs(providerAddress, patientAddress);
      return cid; // Return the authorized CID
  } catch (error) {
      console.error("Error fetching authorized CIDs:", error);
      throw error;
  }
};






