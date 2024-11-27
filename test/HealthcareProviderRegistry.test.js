const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthcareProviderRegistry", function () {
    let HealthcareProviderRegistry, providerRegistry, owner, addr1, addr2;

    // Before each test case, deploy the HealthcareProviderRegistry contract
    beforeEach(async function () {
        // Get test accounts (signers)
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the HealthcareProviderRegistry contract
        HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        providerRegistry = await HealthcareProviderRegistry.deploy();
        await providerRegistry.waitForDeployment(); // Wait for deployment completion
    });

    // Test case: Allows a provider to register themselves in the registry
    it("should allow a provider to register", async function () {
        // Provider registers with their unique data CID
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");

        // Check that the provider is now marked as registered
        const isRegistered = await providerRegistry.isProviderRegistered(addr1.address);
        expect(isRegistered).to.be.true; // Assert the registration status
    });

    // Test case: Allows the admin to verify a registered provider
    it("should allow the admin to verify a provider", async function () {
        // Provider registers
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");

        // Admin verifies the registered provider
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Check that the provider is now marked as verified
        const isVerified = await providerRegistry.isProviderVerified(addr1.address);
        expect(isVerified).to.be.true;
    });

    // Test case: Prevents a provider from registering more than once
    it("should not allow a provider to register twice", async function () {
        // Register the provider once
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");

        // Attempt to register the same provider again
        await expect(
            providerRegistry.connect(addr1).registerHealthcareProvider("providerCID2")
        ).to.be.revertedWith("Provider already registered");
    });

    // Test case: Allows a provider to update their data CID
    it("should allow a provider to update their CID", async function () {
        // Register the provider
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");

        // Update the provider's data CID
        await providerRegistry.connect(addr1).updateDataCID("providerCID2");

        // Verify that the CID has been updated
        const cid = await providerRegistry.getProviderDataCID(addr1.address);
        expect(cid).to.equal("providerCID2");
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
        // Provider registers
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");

        // Non-admin attempts to verify the provider
        await expect(
            providerRegistry.connect(addr1).verifyHealthcareProvider(addr1.address)
        ).to.be.revertedWith("Caller is not the admin");
    });
});
