const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("MedicalRecords", function () {
    let medicalRecords;
    let accessControl;
    let patientRegistry;
    let providerRegistry;
    let owner, patient, provider;

    // Set up test environment before each test
    beforeEach(async function () {
        // Get test accounts
        [owner, patient, provider] = await ethers.getSigners();

        // Deploy the PatientRegistry contract
        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        patientRegistry = await PatientRegistry.deploy();
        await patientRegistry.waitForDeployment(); // Ensure deployment completion

        // Deploy the HealthcareProviderRegistry contract
        const ProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        providerRegistry = await ProviderRegistry.deploy();
        await providerRegistry.waitForDeployment();

        // Deploy the AccessControl contract
        const AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy(
            await patientRegistry.getAddress(),
            await providerRegistry.getAddress()
        );
        await accessControl.waitForDeployment();

        // Deploy the MedicalRecords contract
        const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
        medicalRecords = await MedicalRecords.deploy(await accessControl.getAddress());
        await medicalRecords.waitForDeployment();
    });

    // Test case: Allow authorized providers to upload medical records
    it("should allow authorized providers to upload medical records", async function () {
        // Register patient and provider
        const publicKey = ethers.toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Upload medical records";
        await patientRegistry.connect(patient).registerPatient("patientCID");
        await providerRegistry.connect(provider).registerHealthcareProvider("providerCID", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(provider.address);

        // Provider requests and gets access approval from the patient
        const encryptedKey = ethers.toUtf8Bytes("encryptedKeyExample");
        const cid = "sampleCID";
        await accessControl.connect(provider).requestAccess(patient.address, plainTextPurpose);
        await accessControl.connect(patient).approveAccess(provider.address, encryptedKey, cid);

        // Provider uploads a medical record for the patient
        const recordCID = "recordCID";
        await medicalRecords.connect(provider).uploadMedicalRecord(patient.address, recordCID);

        // Patient retrieves their medical records to verify the upload
        const records = await medicalRecords.connect(patient).getMedicalRecords();
        expect(records.length).to.equal(1);
        expect(records[0].CID).to.equal(recordCID);
    });

    // Test case: Prevent unauthorized providers from uploading medical records
    it("should prevent unauthorized access to upload medical records", async function () {
        // Register the patient
        await patientRegistry.connect(patient).registerPatient("patientCID");

        // Unauthorized provider attempts to upload a record
        const recordCID = "recordCID";
        await expect(
            medicalRecords.connect(provider).uploadMedicalRecord(patient.address, recordCID)
        ).to.be.revertedWith("Caller is not authorized");
    });

    // Test case: Allow patients to retrieve their own medical records
    it("should allow patients to retrieve their own medical records", async function () {
        // Register patient and provider
        const publicKey = ethers.toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Retrieve medical records";
        const encryptedKey = ethers.toUtf8Bytes("encryptedKeyExample");
        const cid = "sampleCID";
        await patientRegistry.connect(patient).registerPatient("patientCID");
        await providerRegistry.connect(provider).registerHealthcareProvider("providerCID", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(provider.address);

        // Provider requests and gets access approval from the patient
        await accessControl.connect(provider).requestAccess(patient.address, plainTextPurpose);
        await accessControl.connect(patient).approveAccess(provider.address, encryptedKey, cid);

        // Provider uploads a medical record for the patient
        const recordCID = "recordCID";
        await medicalRecords.connect(provider).uploadMedicalRecord(patient.address, recordCID);

        // Patient retrieves their medical records to verify the upload
        const records = await medicalRecords.connect(patient).getMedicalRecords();
        expect(records.length).to.equal(1);
        expect(records[0].CID).to.equal(recordCID);
    });

    // Test case: Prevent unauthorized access to retrieve a patient's medical records
    it("should prevent unauthorized access to retrieve a patient's records", async function () {
        // Register the patient
        await patientRegistry.connect(patient).registerPatient("patientCID");

        // Unauthorized provider attempts to access patient records
        await expect(
            medicalRecords.connect(provider).getPatientRecords(patient.address)
        ).to.be.revertedWith("Caller is not authorized");
    });

    // Test case: Allow authorized providers to retrieve a patient's medical records
    it("should allow authorized provider to retrieve patient's medical records", async function () {
        // Register patient and provider
        const publicKey = ethers.toUtf8Bytes("providerPublicKey1");
        const plainTextPurpose = "Retrieve medical records";
        const encryptedKey = ethers.toUtf8Bytes("encryptedKeyExample");
        const cid = "sampleCID";
        await patientRegistry.connect(patient).registerPatient("patientCID");
        await providerRegistry.connect(provider).registerHealthcareProvider("providerCID", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(provider.address);

        // Provider requests and gets access approval from the patient
        await accessControl.connect(provider).requestAccess(patient.address, plainTextPurpose);
        await accessControl.connect(patient).approveAccess(provider.address, encryptedKey, cid);

        // Provider uploads a medical record for the patient
        const recordCID = "recordCID";
        await medicalRecords.connect(provider).uploadMedicalRecord(patient.address, recordCID);

        // Authorized provider retrieves the patient's medical records
        const records = await medicalRecords.connect(provider).getPatientRecords(patient.address);
        expect(records.length).to.equal(1);
        expect(records[0].CID).to.equal(recordCID);
    });
});
