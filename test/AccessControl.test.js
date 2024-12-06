const {toUtf8Bytes, hexlify, ZeroAddress} = require("ethers"); 
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AccessControl", function () {
    let accessControl, patientRegistry, providerRegistry, owner, addr1, addr2;

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
        const AccessControlContract = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControlContract.deploy(
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
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
    
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);
    
        // Provider requests access to patient data for a specific purpose
        const plainTextPurpose = "Consultation";
        await accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose);
    
        // Check that access is not granted until approved
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.false;
    });

    // Test case: Prevents unverified providers from requesting access
    it("should prevent unverified provider from requesting access", async function () {
        // Attempt to request access without verification
        const plainTextPurpose = "Consultation";
        await expect(
            accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose)
        ).to.be.revertedWith("Caller is not a verified provider");
    });

    // Test case: Allows a patient to revoke previously granted access
    it("should allow a patient to revoke access", async function () {
        // Register and verify a healthcare provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Consultation";
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Register the owner as a patient
        await patientRegistry.connect(owner).registerPatient("patientCID1");

        // Request and approve access
        await accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose);
        const encryptedKey = ethers.toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);

        // Revoke access
        await accessControl.connect(owner).revokeAccess(addr1.address);

        // Ensure access has been successfully revoked
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.false;
    });

    // Test case: Prevents data access without explicit approval
    it("should prevent provider from accessing data without approval", async function () {
        // Register and verify a healthcare provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Check that access is not granted without approval
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.false;
    });

    // Test case: Allows a patient to approve access
    it("should allow a patient to approve access", async function () {
        // Register and verify a healthcare provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Consultation";
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        // Register the owner as a patient
        await patientRegistry.connect(owner).registerPatient("patientCID1");

        // Request and approve access
        await accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose);
        const encryptedKey = ethers.toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);

        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.true;
    });

    // Test case: Allows a provider to retrieve the encrypted key after access is approved
    it("should allow a provider to retrieve the encrypted key after access is approved", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Consultation";
    
        // Step 1: Register and verify the provider
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);
        expect(await providerRegistry.isProviderVerified(addr1.address)).to.be.true;
    
        // Step 2: Register the patient
        await patientRegistry.connect(owner).registerPatient("patientCID1");
    
        // Step 3: Provider requests access
        await accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose);
    
        // Step 4: Patient approves access
        const encryptedKey = toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);
    
        // Step 5: Confirm access is granted
        const hasAccess = await accessControl.checkAccess(owner.address, addr1.address);
        expect(hasAccess).to.be.true;
    
        // Step 6: Provider retrieves the encrypted key
        const retrievedKey = await accessControl.connect(addr1).getEncryptedKey(addr1.address, owner.address);
    
        // Compare retrieved key as hex strings
        const expectedHexKey = hexlify(encryptedKey);
        expect(retrievedKey).to.equal(expectedHexKey);
    });
    
    // Test case: Prevents provider from retrieving encrypted key if access is not approved
    it("should prevent provider from retrieving encrypted key if access is not approved", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        await expect(
            accessControl.connect(addr1).getEncryptedKey(owner.address, addr1.address)
        ).to.be.revertedWith("Access not granted");
    });

    // Test case: Allows a provider to retrieve the CID after access is approved
    it("should allow a provider to retrieve the CID after access is approved", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Consultation";
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        await patientRegistry.connect(owner).registerPatient("patientCID1");

        await accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose);
        const encryptedKey = ethers.toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);

        const retrievedCid = await accessControl.connect(addr1).getCid(owner.address, addr1.address);
        expect(retrievedCid).to.equal(cid);
    });

    // Test case: Should handle multiple access requests and approvals correctly
    it("should handle multiple access requests and approvals correctly", async function () {
        const publicKey1 = toUtf8Bytes("providerPublicKey1");
        const publicKey2 = toUtf8Bytes("providerPublicKey2");
        const plainTextPurpose1 = "Consultation";
        const plainTextPurpose2 = "Follow-up";
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey1);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);
        await providerRegistry.connect(addr2).registerHealthcareProvider("providerCID2", publicKey2);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr2.address);

        await patientRegistry.connect(owner).registerPatient("patientCID1");

        await accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose1);
        await accessControl.connect(addr2).requestAccess(owner.address, plainTextPurpose2);

        const encryptedKey1 = ethers.toUtf8Bytes("encrypted_key1");
        const encryptedKey2 = ethers.toUtf8Bytes("encrypted_key2");
        const cid1 = "QmEncryptedDataCID1";
        const cid2 = "QmEncryptedDataCID2";

        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey1, cid1);
        await accessControl.connect(owner).approveAccess(addr2.address, encryptedKey2, cid2);

        const hasAccess1 = await accessControl.checkAccess(owner.address, addr1.address);
        const hasAccess2 = await accessControl.checkAccess(owner.address, addr2.address);
        expect(hasAccess1).to.be.true;
        expect(hasAccess2).to.be.true;

        const retrievedCid1 = await accessControl.connect(addr1).getCid(owner.address, addr1.address);
        const retrievedCid2 = await accessControl.connect(addr2).getCid(owner.address, addr2.address);

        expect(retrievedCid1).to.equal(cid1);
        expect(retrievedCid2).to.equal(cid2);
    });

    // Test case: Prevents unauthorized users from revoking access
    it("should prevent unauthorized users from revoking access", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Consultation";
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        await patientRegistry.connect(owner).registerPatient("patientCID1");

        await accessControl.connect(addr1).requestAccess(owner.address, plainTextPurpose);
        const encryptedKey = ethers.toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);

        await expect(
            accessControl.connect(addr2).revokeAccess(addr1.address)
        ).to.be.revertedWith("Caller is not a registered patient");
    });

    // Test case: Should correctly identify authorized providers
    it("should correctly identify authorized providers", async function () {
        // Register and verify a healthcare provider
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);
    
        // Register the owner as a patient and grant access to addr1
        await patientRegistry.connect(owner).registerPatient("patientCID1");
        await patientRegistry.connect(owner).grantAccess(addr1.address);
    
        // Check authorization
        const isAuthorized = await patientRegistry.isAuthorized(owner.address, addr1.address);
        expect(isAuthorized).to.be.true;
    
        const isNotAuthorized = await patientRegistry.isAuthorized(owner.address, addr2.address);
        expect(isNotAuthorized).to.be.false;
    });
    
    // Test case: Should handle invalid data correctly ie. empty CID and invalid provider address 
    it("should handle invalid data correctly", async function () {
        const plainTextPurpose = "Consultation";
        // Register the owner as a patient
        await patientRegistry.connect(owner).registerPatient("patientCID1");
    
        // Attempt to update CID with an empty string
        await expect(
            patientRegistry.connect(owner).updateDataCID("")
        ).to.be.revertedWith("Invalid CID");
    
        // Attempt to grant access to an invalid address
        await expect(
            patientRegistry.connect(owner).grantAccess(ZeroAddress)
        ).to.be.revertedWith("Invalid provider address");
    });
});
