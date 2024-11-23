const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AccessControl", function () {
    let AccessControl, accessControl, patientRegistry, providerRegistry, owner, addr1, addr2;

    // Setup for each test case, beforeEach allows us to reset the state of the contract before each test
    beforeEach(async function () {
        // Get signers for test cases
        [owner, addr1, addr2] = await ethers.getSigners();
        console.log("Signers:", owner.address, addr1.address, addr2.address);

        // Deploy the PatientRegistry contract
        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        try {
            patientRegistry = await PatientRegistry.deploy();
            await patientRegistry.waitForDeployment(); // Wait until deployment completes
            console.log("PatientRegistry deployed at:", await patientRegistry.getAddress());
        } catch (err) {
            console.error("Error deploying PatientRegistry:", err);
        }

        // Deploy the HealthcareProviderRegistry contract
        const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        providerRegistry = await HealthcareProviderRegistry.deploy();
        try {
            await providerRegistry.waitForDeployment(); // Wait until deployment completes
            console.log("ProviderRegistry deployed at:", await providerRegistry.getAddress());
        } catch (err) {
            console.error("HealthcareProviderRegistry deployment failed:", err);
            throw err;
        }

        // Deploy the AccessControl contract, passing references to other registries
        AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy(
            await patientRegistry.getAddress(),
            await providerRegistry.getAddress()
        );
        try {
            await accessControl.waitForDeployment(); // Wait until deployment completes
            console.log("AccessControl deployed at:", await accessControl.getAddress());
        } catch (err) {
            console.error("AccessControl deployment failed:", err);
            throw err;
        }
    });

    // Test case: Allows a verified provider to request access to patient data
    it("should allow a provider to request access", async function () {
        // Register and verify a healthcare provider
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Provider requests access to patient data for a specific purpose
        const purposeHash = ethers.encodeBytes32String("PurposeHash");
        await accessControl.connect(addr1).requestAccess(owner.address, purposeHash);

        // Check that access is not granted until approved
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.false;
    });

    // Test case: Prevents unverified providers from requesting access
    it("should prevent unverified provider from requesting access", async function () {
        // Attempt to request access without verification
        await expect(
            accessControl.connect(addr1).requestAccess(owner.address, ethers.encodeBytes32String("PurposeHash"))
        ).to.be.revertedWith("Caller is not a verified provider");
    });

    // Test case: Allows a patient to revoke previously granted access
    it("should allow a patient to revoke access", async function () {
        // Register and verify a healthcare provider
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Register the owner as a patient
        await patientRegistry.connect(owner).registerPatient("patientCID1");

        // Request and approve access
        const purposeHash = ethers.encodeBytes32String("PurposeHash");
        await accessControl.connect(addr1).requestAccess(owner.address, purposeHash);
        await accessControl.connect(owner).approveAccess(addr1.address);

        // Revoke access
        await accessControl.connect(owner).revokeAccess(addr1.address);

        // Ensure access has been successfully revoked
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.false;
    });

    // Test case: Prevents data access without explicit approval
    it("should prevent provider from accessing data without approval", async function () {
        // Register and verify a healthcare provider
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Check that access is not granted without approval
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.false;
    });

    // Test case: Allows a patient to approve access
    it("should allow a patient to approve access", async function () {
        // Register and verify a healthcare provider
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1");
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Register the owner as a patient
        await patientRegistry.connect(owner).registerPatient("patientCID1");

        // Request and approve access
        const purposeHash = ethers.encodeBytes32String("PurposeHash");
        await accessControl.connect(addr1).requestAccess(owner.address, purposeHash);
        await accessControl.connect(owner).approveAccess(addr1.address);

        // Ensure access has been successfully granted
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.true;
    });
});
