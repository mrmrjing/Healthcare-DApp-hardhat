// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HealthcareProviderRegistry {
    // The administrator of the contract which initially is the deployer 
    address public admin;

    // Struct to store information about a healthcare provider
    struct HealthcareProvider {
        bool isRegistered; // Indicates if the provider is registered
        bool isVerified;   // Indicates if the provider is verified by the admin
        bool isRejected; // Indicates if the provider is rejected by the admin
        string dataCID;    // Content Identifier for encrypted off-chain provider data
        bytes publicKey; // Public key of the provider
    }

    // Mapping(key-value store) to store healthcare provider data, keyed by their Ethereum address
    mapping(address => HealthcareProvider) private providers;

    // Array to store the addresses of all registered providers
    address[] private providerAddresses;

    // Events to log significant actions
    event ProviderRegistered(address indexed providerAddress, string dataCID, bytes publicKey);
    event ProviderVerified(address indexed providerAddress);
    event ProviderRejected(address indexed providerAddress);

    // Modifier to restrict certain functions to the admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    // Constructor sets the contract deployer as the admin
    constructor() {
        admin = msg.sender;
    }

    // Function for healthcare providers to register themselves
    function registerHealthcareProvider(string calldata dataCID, bytes calldata publicKey) external {
        require(!providers[msg.sender].isRegistered, "Provider already registered");
        providers[msg.sender] = HealthcareProvider({
            isRegistered: true,
            isVerified: false,
            isRejected: false,
            dataCID: dataCID,
            publicKey: publicKey
        });
        providerAddresses.push(msg.sender); // Add the provider's address to the list of registered providers
        emit ProviderRegistered(msg.sender, dataCID, publicKey); // Emit an event for successful registration
    }

    // Function for the admin to verify a healthcare provider
    function verifyHealthcareProvider(address providerAddress) external onlyAdmin {
        require(providers[providerAddress].isRegistered, "Provider not registered");
        require(!providers[providerAddress].isVerified, "Provider already verified");
        require(!providers[providerAddress].isRejected, "Provider has been rejected");
        providers[providerAddress].isVerified = true;
        emit ProviderVerified(providerAddress); // Emit an event for successful verification
    }

    // Function for the admin to reject a healthcare provider
    function rejectHealthcareProvider(address providerAddress) external onlyAdmin {
        require(providers[providerAddress].isRegistered, "Provider not registered");
        require(!providers[providerAddress].isRejected, "Provider already rejected");
        providers[providerAddress].isRejected = true;
        emit ProviderRejected(providerAddress); // Emit an event for rejection
    }

    // Function to check if a provider is verified
    function isProviderVerified(address providerAddress) external view returns (bool) {
        return providers[providerAddress].isVerified;
    }

    // Function to check if a provider is rejected
    function isProviderRejected(address providerAddress) external view returns (bool) {
        return providers[providerAddress].isRejected;
    }

    // Function to check if a provider is registered
    function isProviderRegistered(address providerAddress) external view returns (bool) {
        return providers[providerAddress].isRegistered;
    }

    // Function to get all registered providers
    function getAllProviders() external view onlyAdmin returns (address[] memory) {
        return providerAddresses; 
    }

    // Function to get the public key of a specific provider
    function getProviderPublicKey(address providerAddress) external view returns (bytes memory) {
        require(providers[providerAddress].isRegistered, "Provider not registered");
        return providers[providerAddress].publicKey;
    }
}
