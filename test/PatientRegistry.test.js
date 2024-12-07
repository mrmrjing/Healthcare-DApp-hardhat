const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PatientRegistry", function () {
    let PatientRegistry, patientRegistry, owner, addr1, addr2;

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

    // Test case: Prevents a patient from registering twice
    it("should not allow a patient to register twice", async function () {
        // Register the patient
        await patientRegistry.connect(owner).registerPatient("cid1");

        // Attempt to register the same patient again
        await expect(
            patientRegistry.connect(owner).registerPatient("cid2")
        ).to.be.revertedWith("Patient already registered");
    });
});
