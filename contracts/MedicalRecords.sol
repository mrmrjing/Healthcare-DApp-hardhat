// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol"; 

contract MedicalRecords {
    // Struct to store a medical record
    struct Record {
        bytes32 encryptedCID; // Encrypted Content Identifier of the off-chain medical record
        uint256 timestamp;    // Timestamp indicating when the record was uploaded
    }

    // Mapping to store medical records for each patient (keyed by the patient's address)
    mapping(address => Record[]) private records;

    // Instance of the AccessControl contract for managing permissions
    AccessControl accessControl;

    // Event to log the upload of a medical record
    event MedicalRecordUploaded(address indexed patientAddress, address indexed providerAddress, bytes32 encryptedCID);

    // Modifier to ensure that only authorized users can interact with certain functions
    // - A patient can access their own records
    // - A provider can access records if they have explicit approval from the patient
    modifier onlyAuthorized(address patientAddress) {
        bool isPatient = (msg.sender == patientAddress); // Check if the caller is the patient
        bool isAuthorizedProvider = accessControl.checkAccess(patientAddress, msg.sender); // Check provider authorization
        require(isPatient || isAuthorizedProvider, "Caller is not authorized"); // Revert if neither condition is met
        _;
    }

    // Constructor to initialize the AccessControl contract instance
    constructor(address _accessControlAddress) {
        accessControl = AccessControl(_accessControlAddress);
    }

    // Function to allow authorized users to upload a medical record
    // - Requires the caller to be the patient or an authorized provider
    // - Takes the patient's address and a encrypted CID of the medical record as input
    function uploadMedicalRecord(address patientAddress, bytes32 encryptedCID) external onlyAuthorized(patientAddress) {
        // Add the new record to the patient's record array
        records[patientAddress].push(Record({
            encryptedCID: encryptedCID,
            timestamp: block.timestamp
        }));

        // Emit an event to log the upload action
        emit MedicalRecordUploaded(patientAddress, msg.sender, encryptedCID);
    }

    // Function to allow patients to retrieve their own medical records
    function getMedicalRecords() external view returns (Record[] memory) {
        return records[msg.sender]; // Returns all records associated with the caller's address
    }

    // Function to allow authorized users to retrieve a patient's medical records
    // - Requires the caller to be the patient or an authorized provider
    function getPatientRecords(address patientAddress) external view onlyAuthorized(patientAddress) returns (Record[] memory) {
        return records[patientAddress]; // Returns all records associated with the specified patient's address
    }
}
