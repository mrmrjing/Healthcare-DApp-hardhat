// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PatientRegistry {
    // Struct to store patient information
    struct Patient {
        address patientAddress;                // The address of the patient
        string dataCID;                       // CID for off-chain patient data
        mapping(address => bool) authorizedProviders; // Mapping of authorized providers for the patient
    }

    // Mapping to store patient details, keyed by their address
    mapping(address => Patient) private patients;

    // Explicit tracking of whether a patient is registered
    mapping(address => bool) private isRegistered;

    // Events for logging significant actions
    event PatientRegistered(address indexed patientAddress, string dataCID);
    event DataCIDUpdated(address indexed patientAddress, string newDataCID);
    event AccessGranted(address indexed patientAddress, address indexed providerAddress);
    event AccessRevoked(address indexed patientAddress, address indexed providerAddress);

    // Modifier to restrict access to registered patients only
    modifier onlyPatient() {
        require(isRegistered[msg.sender], "Caller is not the patient");
        _;
    }

    // Modifier to restrict access to authorized providers or the patient themselves
    modifier onlyAuthorizedOrPatient(address patientAddress) {
        require(
            msg.sender == patientAddress || patients[patientAddress].authorizedProviders[msg.sender],
            "Caller is not authorized"
        );
        _;
    }

    // Function to register a new patient
    // - Stores their address and an off-chain data CID
    function registerPatient(string calldata dataCID) external {
        require(!isRegistered[msg.sender], "Patient already registered"); // Ensure the patient isn't already registered
        isRegistered[msg.sender] = true;
        patients[msg.sender].patientAddress = msg.sender; // Assign the caller's address as their patient address
        patients[msg.sender].dataCID = dataCID; // Store the off-chain data CID
        emit PatientRegistered(msg.sender, dataCID); // Emit an event for successful registration
    }

    // Function to update a patient's off-chain data CID
    function updateDataCID(string calldata newDataCID) external onlyPatient {
        require(bytes(newDataCID).length > 0, "Invalid CID"); // Ensure the CID is valid (non-empty)
        patients[msg.sender].dataCID = newDataCID; // Update the CID in storage
        emit DataCIDUpdated(msg.sender, newDataCID); // Emit an event for the update
    }

    // Function for a patient to grant access to their data to a provider
    function grantAccess(address providerAddress) external onlyPatient {
        require(providerAddress != address(0), "Invalid provider address"); // Ensure the provider address is valid
        patients[msg.sender].authorizedProviders[providerAddress] = true; // Grant access to the provider
        emit AccessGranted(msg.sender, providerAddress); // Emit an event for the action
    }

    // Function for a patient to revoke access from a provider
    function revokeAccess(address providerAddress) external onlyPatient {
        require(providerAddress != address(0), "Invalid provider address"); // Ensure the provider address is valid
        patients[msg.sender].authorizedProviders[providerAddress] = false; // Revoke access
        emit AccessRevoked(msg.sender, providerAddress); // Emit an event for the action
    }

    // Function to check if a provider is authorized for a specific patient
    function isAuthorized(address patientAddress, address providerAddress) external view returns (bool) {
    // If the patient is not registered, return false instead of reverting
    if (!isRegistered[patientAddress]) {
        return false;
    }
    return patients[patientAddress].authorizedProviders[providerAddress];
}

    // Function to retrieve the off-chain data CID for a patient
    // - Only the patient or authorized providers can call this function
    function getDataCID(address patientAddress) external view onlyAuthorizedOrPatient(patientAddress) returns (string memory) {
        require(isRegistered[patientAddress], "Patient is not registered"); // Ensure the patient is registered
        return patients[patientAddress].dataCID; // Return the patient's CID
    }

    // Function to check if a specific patient is registered
    function isPatientRegistered(address patientAddress) public view returns (bool) {
        return isRegistered[patientAddress]; // Return the registration status
    }
}
