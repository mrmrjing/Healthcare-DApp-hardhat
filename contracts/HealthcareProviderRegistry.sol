// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HealthcareProviderRegistry {
    // The administrator of the contract which initially is the 
    address public admin;

    // Struct to store information about a healthcare provider
    struct HealthcareProvider {
        bool isRegistered; // Indicates if the provider is registered
        bool isVerified;   // Indicates if the provider is verified by the admin
        string dataCID;    // Content Identifier for encrypted off-chain provider data
    }

    // Mapping(key-value store) to store healthcare provider data, keyed by their Ethereum address
    mapping(address => HealthcareProvider) private providers;

    // Array to store the addresses of all registered providers
    address[] private providerAddresses;

    // Events to log significant actions
    event ProviderRegistered(address indexed providerAddress, string dataCID);
    event ProviderVerified(address indexed providerAddress);
    event ProviderDataUpdated(address indexed providerAddress, string newDataCID);

    // Modifier to restrict certain functions to the admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    // Modifier to restrict certain functions to registered providers
    modifier onlyRegisteredProvider() {
        require(providers[msg.sender].isRegistered, "Caller is not a registered provider");
        _;
    }

    // Constructor sets the contract deployer as the admin
    constructor() {
        admin = msg.sender;
    }

    // Function for healthcare providers to register themselves
    // - Requires the provider to not already be registered
    // - Takes the CID for the provider's encrypted off-chain data as input
    function registerHealthcareProvider(string calldata dataCID) external {
        require(!providers[msg.sender].isRegistered, "Provider already registered");
        providers[msg.sender] = HealthcareProvider({
            isRegistered: true,
            isVerified: false,
            dataCID: dataCID
        });
        providerAddresses.push(msg.sender); // Add the provider's address to the array
        emit ProviderRegistered(msg.sender, dataCID); // Emit an event for successful registration
    }

    // Function for the admin to verify a healthcare provider
    // - Ensures the provider is registered before verifying
    function verifyHealthcareProvider(address providerAddress) external onlyAdmin {
        require(providers[providerAddress].isRegistered, "Provider not registered");
        providers[providerAddress].isVerified = true;
        emit ProviderVerified(providerAddress); // Emit an event for successful verification
    }

    // Function to check if a provider is verified
    // - Publicly accessible
    function isProviderVerified(address providerAddress) external view returns (bool) {
        return providers[providerAddress].isVerified;
    }

    // Function to check if a provider is registered
    // - Publicly accessible
    function isProviderRegistered(address providerAddress) external view returns (bool) {
        return providers[providerAddress].isRegistered;
    }

    // Function for a registered provider to update their off-chain data CID
    function updateDataCID(string calldata newDataCID) external onlyRegisteredProvider {
        providers[msg.sender].dataCID = newDataCID;
        emit ProviderDataUpdated(msg.sender, newDataCID); // Emit an event for successful update
    }

    // Function for the admin to retrieve the data CID of a specific provider
    function getProviderDataCID(address providerAddress) external view onlyAdmin returns (string memory) {
        return providers[providerAddress].dataCID;
    }

    // Function to get all registered providers
    function getAllProviders() external view onlyAdmin returns (address[] memory) {
        return providerAddresses; 
    }
}
