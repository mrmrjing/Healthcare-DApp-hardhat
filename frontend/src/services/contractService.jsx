import { BrowserProvider, Contract } from "ethers";
import deployedAddresses from "../artifacts/deployedAddresses.json";
import AccessControlABI from "../artifacts/contracts/AccessControl.sol/AccessControl.json";
import HealthcareProviderRegistryABI from "../artifacts/contracts/HealthcareProviderRegistry.sol/HealthcareProviderRegistry.json";
import MedicalRecordsABI from "../artifacts/contracts/MedicalRecords.sol/MedicalRecords.json";
import PatientRegistryABI from "../artifacts/contracts/PatientRegistry.sol/PatientRegistry.json";

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

  console.log("[INFO] Initializing provider from MetaMask.");
  return new BrowserProvider(window.ethereum);
};

// Get the signer for transactions
const getSigner = async () => {
  const provider = await getProvider();
  console.log("[INFO] Obtaining signer from provider.");
  return provider.getSigner();
};

// Get Contract Instance
export const getContract = async (contractName) => {
  try {
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
        throw new Error(`[ERROR] Unknown contract: ${contractName}`);
    }

    console.log(`[INFO] Fetching contract instance: ${contractName}`);
    return new Contract(address, abi, signer);
  } catch (error) {
    console.error("[ERROR] Error in getContract:", error.message);
    throw error;
  }
};
 
// ========================Core functions to interact with the blockchain================================

// Function to request access to a patient' data
export const requestAccess = async (patientAddress, plainTextPurpose) => {
  try {
    if (!patientAddress || !plainTextPurpose) {
      throw new Error("Invalid arguments: patientAddress or plainTextPurpose is missing.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Requesting access for patient:", patientAddress);

    const tx = await accessControl.requestAccess(patientAddress, plainTextPurpose);
    await tx.wait();

    console.log("[SUCCESS] Access request sent successfully.");
  } catch (error) {
    console.error("[ERROR] Error requesting access:", error.message);
    throw error;
  }
};

// Function to approve access for a provider
export const approveAccess = async (providerAddress, encryptedKey, cid) => {
  try {
    if (!providerAddress || !encryptedKey || !cid) {
      throw new Error("Invalid arguments: providerAddress, encryptedKey, or CID is missing.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Approving access for provider:", providerAddress);

    const tx = await accessControl.approveAccess(providerAddress, encryptedKey, cid);
    await tx.wait();

    console.log("[SUCCESS] Access approved with encrypted key and CID.");
  } catch (error) {
    console.error("[ERROR] Error approving access:", error.message);
    throw error;
  }
};

// Function to revoke access from a provider
export const revokeAccess = async (providerAddress) => {
  try {
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is missing.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Revoking access for provider:", providerAddress);

    const tx = await accessControl.revokeAccess(providerAddress);
    await tx.wait();

    console.log("[SUCCESS] Access revoked.");
  } catch (error) {
    console.error("[ERROR] Error revoking access:", error.message);
    throw error;
  }
};

// Function to check if a provider has access to a patient's data
export const checkAccess = async (patientAddress, providerAddress) => {
  try {
    if (!patientAddress || !providerAddress) {
      throw new Error("Invalid arguments: patientAddress or providerAddress is missing.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Checking access for provider:", providerAddress);

    const hasAccess = await accessControl.checkAccess(patientAddress, providerAddress);
    console.log("[INFO] Access check result:", hasAccess);

    return hasAccess;
  } catch (error) {
    console.error("[ERROR] Error checking access:", error.message);
    throw error;
  }
};

// Function to check if a request is pending
export const checkPending = async (patientAddress, providerAddress) => {
  try {
    if (!patientAddress || !providerAddress) {
      throw new Error("Invalid arguments: patientAddress or providerAddress is missing.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Checking request pending status:", providerAddress);

    const hasAccess = await accessControl.checkPending(patientAddress, providerAddress);
    console.log("[INFO] status result:", hasAccess);

    return hasAccess;
  } catch (error) {
    console.error("[ERROR] Error checking pending:", error.message);
    throw error;
  }
};

// Function to register a provider
export const registerProvider = async (dataCID, publicKeyBytes) => {
  try {
    if (!dataCID || !publicKeyBytes) {
      throw new Error("Invalid arguments: dataCID or publicKeyBytes is missing.");
    }
    //check if patient
    const signer = await getSigner();
    const patientAddress = signer.getAddress();
    const isDoc = await isPatientRegistered(patientAddress);
    if (isDoc) { throw new Error("This account is already registered as a Patient!")}

    const registry = await getContract("healthcareProviderRegistry");
    console.log("[INFO] Registering provider with CID:", dataCID);

    const tx = await registry.registerHealthcareProvider(dataCID, publicKeyBytes);
    await tx.wait();

    console.log("[SUCCESS] Provider registered successfully.");
    return tx;
  } catch (error) {
    console.error("[ERROR] Error registering provider:", error.message);
    throw error;
  }
};

// Function to verify a registered provider
export const verifyProvider = async (providerAddress) => {
  try {
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is missing.");
    }

    const registry = await getContract("healthcareProviderRegistry");
    console.log("[INFO] Verifying provider:", providerAddress);

    const tx = await registry.verifyHealthcareProvider(providerAddress);
    await tx.wait();

    console.log("[SUCCESS] Provider verified.");
    return true;
  } catch (error) {
    console.error("[ERROR] Error verifying provider:", error.message);
    return false;
  }
};

// Function to check if a provider is verified
export const isProviderVerified = async (providerAddress) => {
  try {
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is missing.");
    }

    const registry = await getContract("healthcareProviderRegistry");
    console.log("[INFO] Checking if provider is verified:", providerAddress);

    const isVerified = await registry.isProviderVerified(providerAddress);
    console.log("[INFO] Verification status:", isVerified);

    return isVerified;
  } catch (error) {
    console.error("[ERROR] Error checking provider verification:", error.message);
    throw error;
  }
};

// Function to upload a medical record for a patient
export const uploadMedicalRecord = async (patientAddress, CID) => {
  try {
    if (!patientAddress || !CID) {
      throw new Error("Invalid arguments: patientAddress or CID is missing.");
    }

    const medicalRecords = await getContract("medicalRecords");
    console.log("[INFO] Uploading medical record for patient:", patientAddress);

    const tx = await medicalRecords.uploadMedicalRecord(patientAddress, CID);
    await tx.wait();

    console.log("[SUCCESS] Medical record uploaded successfully.");
  } catch (error) {
    console.error("[ERROR] Error uploading medical record:", error.message);
    throw error;
  }
};

// Function to fetch all medical records for the current user
export const getMyMedicalRecords = async () => {
  try {
    const medicalRecords = await getContract("medicalRecords");
    console.log("[INFO] Fetching medical records for the current user.");

    const records = await medicalRecords.getMedicalRecords();

    // Parse records to include human-readable timestamps
    return records.map((record) => ({
      CID: record.CID,
      timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
    }));
  } catch (error) {
    console.error("[ERROR] Error fetching medical records:", error.message);
    return [];
  }
};

// Function to fetch a specific patient's medical records
export const getPatientRecords = async (patientAddress) => {
  try {
    if (!patientAddress) {
      throw new Error("Invalid argument: patientAddress is missing.");
    }

    const medicalRecords = await getContract("medicalRecords");
    console.log("[INFO] Fetching medical records for patient:", patientAddress);

    const records = await medicalRecords.getPatientRecords(patientAddress);

    // Parse records to include human-readable timestamps
    return records.map((record) => ({
      CID: record.CID,
      timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
    }));
  } catch (error) {
    console.error("[ERROR] Error fetching patient records:", error.message);
    return [];
  }
};

// Function to register a patient
export const registerPatient = async (dataCID) => {
  try {
    if (!dataCID) {
      throw new Error("Invalid argument: dataCID is missing.");
    }
    //check if doctor
    const signer = await getSigner();
    const patientAddress = signer.getAddress();
    const isDoc = await isProviderRegistered(patientAddress);
    if (isDoc) { throw new Error("This account is already registered as a doctor!")}

    const patientRegistry = await getContract("patientRegistry");
    console.log("[INFO] Registering patient with CID:", dataCID);
    const tx = await patientRegistry.registerPatient(dataCID);
    await tx.wait();

    console.log("[SUCCESS] Patient registered successfully.");
    return tx;
  } catch (error) {
    console.error("[ERROR] Error registering patient:", error.message);
    throw error;
  }
};

// Function to grant a provider access to a patient's data
export const grantAccessToProvider = async (providerAddress) => {
  try {
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is missing.");
    }

    const patientRegistry = await getContract("patientRegistry");
    console.log("[INFO] Granting access to provider:", providerAddress);

    const tx = await patientRegistry.grantAccess(providerAddress);
    await tx.wait();

    console.log("[SUCCESS] Access granted to provider.");
  } catch (error) {
    console.error("[ERROR] Error granting access:", error.message);
    throw error;
  }
};

// Function to revoke access from a provider
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

// Function to check if a provider is authorized for a patient
export const isAuthorized = async (patientAddress, providerAddress) => {
  try {
    if (!patientAddress || !providerAddress) {
      throw new Error("Invalid arguments: patientAddress or providerAddress is missing.");
    }

    const patientRegistry = await getContract("patientRegistry");
    console.log("[INFO] Checking authorization for provider:", providerAddress);

    const isAuthorized = await patientRegistry.isAuthorized(patientAddress, providerAddress);
    console.log("[INFO] Authorization status:", isAuthorized);

    return isAuthorized;
  } catch (error) {
    console.error("[ERROR] Error checking authorization:", error.message);
    throw error;
  }
};

// Function to check if a provider is registered
export const isProviderRegistered = async (providerAddress) => {
  try {
    // Validate the provider address
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is required.");
    }

    console.log("[INFO] Checking registration status for provider:", providerAddress);

    const registry = await getContract("healthcareProviderRegistry");
    const isRegistered = await registry.isProviderRegistered(providerAddress);

    console.log(`[INFO] Registration status for provider (${providerAddress}):`, isRegistered);
    return isRegistered;
  } catch (error) {
    console.error("[ERROR] Error checking provider registration:", error.message);
    return false;
  }
};

// Checks if a provider is rejected
export const isProviderRejected = async (providerAddress) => {
  try {
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is required.");
    }

    console.log("[INFO] Checking rejection status for provider:", providerAddress);
    const registry = await getContract("healthcareProviderRegistry");
    const isRejected = await registry.isProviderRejected(providerAddress);

    console.log(`[INFO] Rejection status for provider (${providerAddress}):`, isRejected);
    return isRejected;
  } catch (error) {
    console.error("[ERROR] Error checking provider rejection:", error.message);
    return false;
  }
};

// Checks if a patient is registered
export const isPatientRegistered = async (patientAddress) => {
  try {
    if (!patientAddress) {
      throw new Error("Invalid argument: patientAddress is required.");
    }

    console.log("[INFO] Checking registration status for patient:", patientAddress);
    const patientRegistry = await getContract("patientRegistry");
    const isRegistered = await patientRegistry.isPatientRegistered(patientAddress);

    console.log(`[INFO] Registration status for patient (${patientAddress}):`, isRegistered);

    return isRegistered;
  } catch (error) {
    console.error("[ERROR] Error checking patient registration:", error.message);
    return false;
  }
};

// Function to get all registered providers
export const getAllProviders = async () => {
  try {
    const registry = await getContract("healthcareProviderRegistry");
    console.log("[INFO] Fetching all registered providers.");

    const providers = await registry.getAllProviders();
    console.log("[INFO] Providers fetched:", providers);

    return providers;
  } catch (error) {
    console.error("[ERROR] Error fetching providers:", error.message);
    return [];
  }
};

// Function to get the events emitted by the HealthcareProviderRegistry contract
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
        const dataCID = event.args.dataCID; 
        const publicKey = event.args.publicKey; 

        console.log("Provider Address:", providerAddress);
        console.log("CID:", dataCID);
        console.log("Public Key:", publicKey);

        const isRejected = await registry.isProviderRejected(providerAddress);
        const isVerified = await registry.isProviderVerified(providerAddress);

        return {
          address: providerAddress,
          dataCID, 
          publicKey, 
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

// Function to reject a provider verification request
export const rejectProvider = async (providerAddress) => {
  try {
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is required.");
    }

    const registry = await getContract("healthcareProviderRegistry");
    console.log("[INFO] Rejecting provider verification request for:", providerAddress);

    const tx = await registry.rejectHealthcareProvider(providerAddress);
    await tx.wait();

    console.log("[SUCCESS] Provider rejected successfully.");
    return true;
  } catch (error) {
    console.error("[ERROR] Error rejecting provider:", error.message);
    return false;
  }
};

// Function to get a provider's public key
export const getProviderPublicKey = async (providerAddress) => {
  try {
    if (!providerAddress) {
      throw new Error("Invalid argument: providerAddress is required.");
    }

    const registry = await getContract("healthcareProviderRegistry");
    console.log("[INFO] Fetching public key for provider:", providerAddress);

    const publicKey = await registry.getProviderPublicKey(providerAddress);
    console.log("[SUCCESS] Provider public key retrieved:", publicKey);

    return publicKey;
  } catch (error) {
    console.error("[ERROR] Error fetching provider public key:", error.message);
    throw error;
  }
};

// Function to retrieve the encrypted key for a specific provider-patient pair 
export const getEncryptedKey = async (providerAddress, patientAddress) => {
  try {
    if (!providerAddress || !patientAddress) {
      throw new Error("Invalid arguments: providerAddress and patientAddress are required.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Fetching encrypted key for provider:", providerAddress, "and patient:", patientAddress);

    const encryptedKey = await accessControl.getEncryptedKey(providerAddress, patientAddress);
    console.log("[SUCCESS] Encrypted key retrieved:", encryptedKey);

    return encryptedKey;
  } catch (error) {
    console.error("[ERROR] Error retrieving encrypted key:", error.message);
    throw error;
  }
};

// Function to retrieve access requests for a specific patient 
export const fetchPendingRequests = async (patientAddress) => {
  try {
    if (!patientAddress) {
      throw new Error("Invalid argument: patientAddress is required.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Fetching pending access requests for patient:", patientAddress);

    // Fetch all AccessRequested events for the patient
    const events = await accessControl.queryFilter(accessControl.filters.AccessRequested(patientAddress));
    console.log("[INFO] Pending access requests fetched:", events);
    // Structure the events into a readable format
    return  events.map((event) => ({
        doctorAddress: event.args.providerAddress,
        purposeHash: event.args.purposeHash,
        plainTextPurpose: event.args.plainTextPurpose || "Purpose not available",
        cid: event.args.cid,
        date: event.args.timestamp
      }));

  } catch (error) {
    console.error("[ERROR] Error fetching pending requests:", error.message);
    return [];
  }
};

// Function to retrieve approves and revoked for a specific patient 
export const getApprovedEvents = async (patientAddress) =>{
  try {
    if (!patientAddress) {
      throw new Error("Invalid argument: patientAddress is required.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Fetching approved events for patient:", patientAddress);

    // Fetch all AccessApproved events for the patient
    const events = await accessControl.queryFilter(accessControl.filters.AccessApproved(patientAddress));
    console.log("[INFO] approve access events fetched:", events);

    // Structure the events into a readable format
    return  events.map((event) => ({
        doctorAddress: event.args.providerAddress,
        date: event.args.timestamp,
        action: "Approved"
      }));

  } catch (error) {
    console.error("[ERROR] Error fetching approve access events:", error.message);
    return [];
  }
}

// Function to retrieve approves and revoked for a specific patient 
export const getRevokedEvents = async (patientAddress) =>{
  try {
    if (!patientAddress) {
      throw new Error("Invalid argument: patientAddress is required.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Fetching revoked events for patient:", patientAddress);

    // Fetch all AccessRevoked events for the patient
    const events = await accessControl.queryFilter(accessControl.filters.AccessRevoked(patientAddress));
    console.log("[INFO] revoke access events fetched:", events);

    // Structure the events into a readable format
    return  events.map((event) => ({
        doctorAddress: event.args.providerAddress,
        date: event.args.timestamp,
        action: "Revoked"
      }));

  } catch (error) {
    console.error("[ERROR] Error fetching revoke access events:", error.message);
    return [];
  }
}

// Function to get authorized CIDs for a provider-patient pair
export const getAuthorizedCIDs = async (providerAddress, patientAddress) => {
  try {
    if (!providerAddress || !patientAddress) {
      throw new Error("Invalid arguments: providerAddress and patientAddress are required.");
    }

    const accessControl = await getContract("accessControl");
    console.log("[INFO] Fetching authorized CIDs for provider:", providerAddress, "and patient:", patientAddress);

    const cid = await accessControl.getAuthorizedCIDs(providerAddress, patientAddress);
    console.log("[SUCCESS] Authorized CIDs retrieved:", cid);

    return cid;
  } catch (error) {
    console.error("[ERROR] Error fetching authorized CIDs:", error.message);
    throw error;
  }
};






