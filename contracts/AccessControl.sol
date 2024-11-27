// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PatientRegistry.sol";
import "./HealthcareProviderRegistry.sol";

contract AccessControl {
    // Struct to represent an access request
    struct AccessRequest {
        bool isApproved;       
        bytes32 purposeHash;   // A hash representing the purpose of access
    }

    // Mapping to store access requests: patient -> provider -> access request details
    mapping(address => mapping(address => AccessRequest)) private accessRequests;

    // Instances of the external contracts
    PatientRegistry patientRegistry;
    HealthcareProviderRegistry providerRegistry;

    // Events for logging access request, approval, and revocation
    event AccessRequested(address indexed patientAddress, address indexed providerAddress, bytes32 purposeHash);
    event AccessApproved(address indexed patientAddress, address indexed providerAddress);
    event AccessRevoked(address indexed patientAddress, address indexed providerAddress);

    // Modifier to allow only registered patients to perform certain actions
    modifier onlyRegisteredPatient() {
        require(patientRegistry.isPatientRegistered(msg.sender), "Caller is not a registered patient");
        _;
    }

    // Modifier to allow only verified providers to perform certain actions
    modifier onlyVerifiedProvider() {
        require(providerRegistry.isProviderVerified(msg.sender), "Caller is not a verified provider");
        _;
    }

    // Constructor to initialize the contract with addresses of the registry contracts
    constructor(address _patientRegistryAddress, address _providerRegistryAddress) {
        patientRegistry = PatientRegistry(_patientRegistryAddress);
        providerRegistry = HealthcareProviderRegistry(_providerRegistryAddress);
    }

    // Function for a healthcare provider to request access to a patient's data
    // - The provider must be verified
    // - Access must not already be approved
    function requestAccess(address patientAddress, bytes32 purposeHash) external onlyVerifiedProvider {
        require(!accessRequests[patientAddress][msg.sender].isApproved, "Access already approved");
        
        // Create a new access request
        accessRequests[patientAddress][msg.sender] = AccessRequest({
            isApproved: false,
            purposeHash: purposeHash
        });
        
        // Emit an event for the access request
        emit AccessRequested(patientAddress, msg.sender, purposeHash);
    }

    // Function for a patient to approve a provider's access request
    // - The patient must be registered
    // - Access must not already be approved
    function approveAccess(address providerAddress) external onlyRegisteredPatient {
        require(!accessRequests[msg.sender][providerAddress].isApproved, "Access already approved");
        
        // Approve the access request
        accessRequests[msg.sender][providerAddress].isApproved = true;
        
        // Emit an event for the approval
        emit AccessApproved(msg.sender, providerAddress);
    }

    // Function for a patient to revoke a provider's access
    // - The patient must be registered
    // - Access must already be approved
    function revokeAccess(address providerAddress) external onlyRegisteredPatient {
        require(accessRequests[msg.sender][providerAddress].isApproved, "Access not granted");
        
        // Revoke the access
        accessRequests[msg.sender][providerAddress].isApproved = false;
        
        // Emit an event for the revocation
        emit AccessRevoked(msg.sender, providerAddress);
    }

    // Function to check if a provider has access to a patient's data
    // - Can be called by anyone
    function checkAccess(address patientAddress, address providerAddress) external view returns (bool) {
        return accessRequests[patientAddress][providerAddress].isApproved;
    }
}
