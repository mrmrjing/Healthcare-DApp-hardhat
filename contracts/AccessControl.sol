// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PatientRegistry.sol";
import "./HealthcareProviderRegistry.sol";

contract AccessControl {
    // Struct to represent an access request
    struct AccessRequest {
        bool isApproved;
        bool isPending;
        bytes32 purposeHash;   // A hash representing the purpose of access
        bytes encryptedKey;    // The encrypted key (added to store encrypted key)
        string plainTextPurpose; // The plain text purpose of access (added to store plain text purpose)
        string cid; // The CID of the encrypted key stored in IPFS (added to store CID)
        uint256 timestamp;
    }

    // Mapping to store access requests: patient -> provider -> access request details
    mapping(address => mapping(address => AccessRequest)) private accessRequests;

    // Instances of the external contracts
    PatientRegistry patientRegistry;
    HealthcareProviderRegistry providerRegistry;

    // Events for logging access request, approval, and revocation
    event AccessRequested(
        address indexed patientAddress,
        address indexed providerAddress,
        bytes32 purposeHash,
        string plainTextPurpose, 
        string cid,
        uint256 timestamp
    );
    event AccessApproved(
        address indexed patientAddress,
        address indexed providerAddress,
        bytes encryptedKey,
        uint256 timestamp
    );
    event AccessRevoked(
        address indexed patientAddress,
        address indexed providerAddress,
        uint256 timestamp
    );

    // Modifier to allow only registered patients to perform certain actions
    modifier onlyRegisteredPatient() {
        require(
            patientRegistry.isPatientRegistered(msg.sender),
            "Caller is not a registered patient"
        );
        _;
    }

    // Modifier to allow only verified providers to perform certain actions
    modifier onlyVerifiedProvider() {
        require(
            providerRegistry.isProviderVerified(msg.sender),
            "Caller is not a verified provider"
        );
        _;
    }

    // Constructor to initialize the contract with addresses of the registry contracts
    constructor(address _patientRegistryAddress, address _providerRegistryAddress) {
        patientRegistry = PatientRegistry(_patientRegistryAddress);
        providerRegistry = HealthcareProviderRegistry(_providerRegistryAddress);
    }

    // Function for a healthcare provider to request access to a patient's data
    function requestAccess(address patientAddress, string memory purpose) external onlyVerifiedProvider {
        bytes32 purposeHash = keccak256(abi.encodePacked(purpose));
        require(!accessRequests[patientAddress][msg.sender].isApproved, "Access already approved");

        accessRequests[patientAddress][msg.sender] = AccessRequest({
            isApproved: false,
            isPending: true,
            purposeHash: purposeHash,
            plainTextPurpose: purpose,
            encryptedKey: "",
            cid: "",
            timestamp: block.timestamp
        });

        emit AccessRequested(patientAddress, msg.sender, purposeHash, purpose, "", block.timestamp);
    }     
    
    // Function for a patient to approve a provider's access request, including the encrypted key and the CID 
    function approveAccess(address providerAddress, bytes calldata encryptedKey, string calldata cid)
        external
        onlyRegisteredPatient
    {
        require(
            !accessRequests[msg.sender][providerAddress].isApproved,
            "Access already approved"
        );

        // Approve the access request and store the encrypted key
        accessRequests[msg.sender][providerAddress].isApproved = true;
        accessRequests[msg.sender][providerAddress].isPending = false;
        accessRequests[msg.sender][providerAddress].encryptedKey = encryptedKey;
        accessRequests[msg.sender][providerAddress].cid = cid;
        accessRequests[msg.sender][providerAddress].timestamp = block.timestamp;

        // Emit an event for the approval, including the encrypted key
        emit AccessApproved(msg.sender, providerAddress, encryptedKey, block.timestamp);
    }

    // Function for a patient to revoke a provider's access
    function revokeAccess(address providerAddress) external onlyRegisteredPatient {
        require(
            accessRequests[msg.sender][providerAddress].isApproved,
            "Access not granted"
        );

        // Revoke the access
        accessRequests[msg.sender][providerAddress].isApproved = false;
        accessRequests[msg.sender][providerAddress].isPending = false;
        accessRequests[msg.sender][providerAddress].encryptedKey = ""; // Clear the encrypted key
        accessRequests[msg.sender][providerAddress].timestamp = block.timestamp;

        // Emit an event for the revocation
        emit AccessRevoked(msg.sender, providerAddress, block.timestamp);
    }

    // Function to check if a provider has access to a patient's data
    function checkAccess(address patientAddress, address providerAddress)
        external
        view
        returns (bool)
    {
        return accessRequests[patientAddress][providerAddress].isApproved;
    }

    // Function to check if a request is pending
    function checkPending(address patientAddress, address providerAddress)
        external
        view
        returns (bool)
    {
        return accessRequests[patientAddress][providerAddress].isPending;
    }

    // Function to retrieve the encrypted key for a provider-patient pair
    function getEncryptedKey(address providerAddress, address patientAddress)
        external
        view
        onlyVerifiedProvider
        returns (bytes memory)
    {
        require(
            accessRequests[patientAddress][providerAddress].isApproved,
            "Access not granted"
        );

        return accessRequests[patientAddress][providerAddress].encryptedKey;
    }

    // Function to retrieve the cid for a specific access request
    function getCid(address patientAddress, address providerAddress)
        external
        view
        onlyVerifiedProvider
        returns (string memory)
    {
        return accessRequests[patientAddress][providerAddress].cid;
    }

    // Function to fetch CIDs that a provider has access to 
    function getAuthorizedCIDs(address providerAddress, address patientAddress) 
        external 
        view 
        onlyVerifiedProvider 
        returns (string memory) 
    {
        require(accessRequests[patientAddress][providerAddress].isApproved, "Access not granted.");
        return accessRequests[patientAddress][providerAddress].cid;
    }

}
