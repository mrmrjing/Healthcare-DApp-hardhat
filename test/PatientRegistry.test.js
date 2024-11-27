const { expect } = require("chai");
const { ethers } = require("hardhat");
const ipfsClient = require('ipfs-http-client');
require("@nomicfoundation/hardhat-chai-matchers");



describe("PatientRegistry", function () {
    let PatientRegistry, patientRegistry, owner, addr1, addr2;

    // Initialize IPFS client for local node
    const ipfs = ipfsClient({
        host: 'localhost',
        port: '5001',
        protocol: 'http',
    });

    // Deploy the PatientRegistry contract and set up test accounts before each test
    beforeEach(async function () {
        // Get test accounts
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the PatientRegistry contract
        PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        patientRegistry = await PatientRegistry.deploy();
        await patientRegistry.waitForDeployment(); // Ensure deployment is complete
    });

    // Test case: Allows a patient to register
    it("should allow a patient to register", async function () {
        // Register the patient with a CID
        await patientRegistry.connect(owner).registerPatient("cid1");

        // Verify that the patient is registered
        const isRegistered = await patientRegistry.isPatientRegistered(owner.address);
        expect(isRegistered).to.be.true;
    });

    // Test case: Allows a patient to update their CID
    it("should allow a patient to update their CID", async function () {
        // Register the patient
        await patientRegistry.connect(owner).registerPatient("cid1");

        // Update the patient's data CID
        await patientRegistry.connect(owner).updateDataCID("cid2");

        // Verify that the CID has been updated
        const cid = await patientRegistry.getDataCID(owner.address);
        expect(cid).to.equal("cid2");
    });

    // Test case: Prevents unauthorized users from updating a patient's CID
    it("should prevent others from updating a patient's data CID", async function () {
        // Register the patient
        await patientRegistry.connect(owner).registerPatient("cid1");

        // Attempt to update the patient's CID from another account
        await expect(
            patientRegistry.connect(addr1).updateDataCID("cid2")
        ).to.be.revertedWith("Caller is not the patient");
    });

    // Test case: Allows a patient to grant access to a provider
    it("should allow a patient to grant access to a provider", async function () {
        // Register the patient
        await patientRegistry.connect(owner).registerPatient("cid1");

        // Grant access to a provider
        await patientRegistry.connect(owner).grantAccess(addr1.address);

        // Verify that the provider has access
        const isAuthorized = await patientRegistry.isAuthorized(owner.address, addr1.address);
        expect(isAuthorized).to.be.true;
    });

    // Test case: Allows a patient to revoke access from a provider
    it("should allow a patient to revoke access from a provider", async function () {
        // Register the patient and grant access to a provider
        await patientRegistry.connect(owner).registerPatient("cid1");
        await patientRegistry.connect(owner).grantAccess(addr1.address);

        // Revoke access from the provider
        await patientRegistry.connect(owner).revokeAccess(addr1.address);

        // Verify that the provider no longer has access
        const isAuthorized = await patientRegistry.isAuthorized(owner.address, addr1.address);
        expect(isAuthorized).to.be.false;
    });

    // Test case: Prevents a patient from registering twice
    it("should not allow a patient to register twice", async function () {
        // Register the patient
        await patientRegistry.connect(owner).registerPatient("cid1");

        // Attempt to register the same patient again
        await expect(
            patientRegistry.connect(owner).registerPatient("cid2")
        ).to.be.revertedWith("Patient already registered");
    });

    // Test case: Verifies that the CID in the PatientRegistry contract matches the IPFS CID
    it("should match the IPFS CID", async function () {
       // Create patient data
       const patientData = {
        name: "Satoshi Nakamoto",
        dob: "1990-01-01",
        address: "123 Blockchain St",
        medicalHistory: "None",
        contact: "123-456-7890",
    };

    // Upload the data to IPFS
    const result = await ipfs.add(JSON.stringify(patientData));
    const ipfsCID = result.cid.toString();
    console.log("Uploaded to IPFS. CID:", ipfsCID);

    // Register the patient with the IPFS CID in the contract 
    await patientRegistry.connect(owner).registerPatient(ipfsCID);

    // Retrieve the CID from the contract 
    const contractCID = await patientRegistry.getDataCID(owner.address);

    // Assert that the CIDs match
    expect(contractCID).to.equal(ipfsCID);
    });
});
