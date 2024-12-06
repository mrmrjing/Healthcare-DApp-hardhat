const { expect } = require("chai");
const { ethers } = require("hardhat");
const {toUtf8Bytes, hexlify} = require("ethers");

describe("HealthcareProviderRegistry", function () {
    let HealthcareProviderRegistry, providerRegistry, owner, addr1, addr2;

    // Before each test case, deploy the HealthcareProviderRegistry contract
    beforeEach(async function () {
        // Get test accounts (signers)
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the HealthcareProviderRegistry contract
        HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        providerRegistry = await HealthcareProviderRegistry.deploy();
        await providerRegistry.waitForDeployment(); 
    });

    // Test case: Allows a provider to register themselves in the registry
    it("should allow a provider to register", async function () {
        // Generate a public key for the provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        // Provider registers with their unique data CID
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);

        // Check that the provider is now marked as registered
        const isRegistered = await providerRegistry.isProviderRegistered(addr1.address);
        expect(isRegistered).to.be.true; // Assert the registration status

        // Check the the stored public key is correct
        const storedPublicKey = await providerRegistry.getProviderPublicKey(addr1.address);
        expect(storedPublicKey).to.equal(hexlify(publicKey));
    });

    // Test case: Allows the admin to verify a registered provider
    it("should allow the admin to verify a provider", async function () {
        // Generate a public key for the provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        // Provider registers
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);

        // Admin verifies the registered provider
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Check that the provider is now marked as verified
        const isVerified = await providerRegistry.isProviderVerified(addr1.address);
        expect(isVerified).to.be.true;
    });

    // Test case: Prevents a provider from registering more than once
    it("should not allow a provider to register twice", async function () {
        // Generate a public key for the provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        // Register the provider once
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey );

        // Attempt to register the same provider again
        await expect(
            providerRegistry.connect(addr1).registerHealthcareProvider("providerCID2", publicKey)
        ).to.be.revertedWith("Provider already registered");
    });

    // Test case: Prevents the admin from verifying a provider who is not registered
    it("should prevent verifying an unregistered provider", async function () {
        // Attempt to verify a provider who hasn't registered
        await expect(
            providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address)
        ).to.be.revertedWith("Provider not registered");
    });

    // Test case: Prevents non-admin users from verifying a provider
    it("should prevent non-admin from verifying a provider", async function () {
        // Generate a public key for the provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        // Provider registers
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);

        // Non-admin attempts to verify the provider
        await expect(
            providerRegistry.connect(addr1).verifyHealthcareProvider(addr1.address)
        ).to.be.revertedWith("Caller is not the admin");
    });

    // Test case: Prevents a rejected provider from being verified
    it("should not allow a rejected provider to be verified", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).rejectHealthcareProvider(addr1.address);
    
        await expect(
            providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address)
        ).to.be.revertedWith("Provider has been rejected");
    });
    
    // Test case: Prevent rejected providers from registering again with the same address
    it("should not allow a rejected provider to register again", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        const publicKey2 = toUtf8Bytes("providerPublicKey2");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).rejectHealthcareProvider(addr1.address);
    
        await expect(
            providerRegistry.connect(addr1).registerHealthcareProvider("providerCID2", publicKey2)
        ).to.be.revertedWith("Provider already registered");
    });
    
    // Test case: Allows only the admin to access the list of registered providers
    it("should only allow admin to retrieve all providers", async function () {
        await expect(
            providerRegistry.connect(addr1).getAllProviders()
        ).to.be.revertedWith("Caller is not the admin");
    });
    
    // Test case: Ensure that only registered providers' public keys can be accessed 
    it("should not allow public key retrieval for unregistered providers", async function () {
        await expect(
            providerRegistry.connect(addr1).getProviderPublicKey(addr1.address)
        ).to.be.revertedWith("Provider not registered");
    });
    
});
