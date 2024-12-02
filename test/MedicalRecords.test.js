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
        await patientRegistry.connect(patient).registerPatient("patientCID");
        await providerRegistry.connect(provider).registerHealthcareProvider("providerCID");
        await providerRegistry.connect(owner).verifyHealthcareProvider(await provider.getAddress());

        // Provider requests and gets access approval from the patient
        const purposeHash = ethers.encodeBytes32String("PurposeHash");
        await accessControl.connect(provider).requestAccess(await patient.getAddress(), purposeHash);
        await accessControl.connect(patient).approveAccess(await provider.getAddress());

        // Provider uploads a medical record for the patient
        const recordCID = ethers.toUtf8Bytes("recordCID");
        await medicalRecords.connect(provider).uploadMedicalRecord(await patient.getAddress(), recordCID);

        // Patient retrieves their medical records to verify the upload
        const records = await medicalRecords.connect(patient).getMedicalRecords();
        expect(records.length).to.equal(1);
        expect(records[0].encryptedCID).to.equal(ethers.hexlify(recordCID));
    });

    // Test case: Prevent unauthorized providers from uploading medical records
    it("should prevent unauthorized access to upload medical records", async function () {
        // Register the patient
        await patientRegistry.connect(patient).registerPatient("patientCID");

        // Unauthorized provider attempts to upload a record
        const recordCID = ethers.toUtf8Bytes("recordCID");
        await expect(
            medicalRecords.connect(provider).uploadMedicalRecord(await patient.getAddress(), recordCID)
        ).to.be.revertedWith("Caller is not authorized");
    });

    // Test case: Allow patients to retrieve their own medical records
    it("should allow patients to retrieve their own medical records", async function () {
        // Register patient and provider
        await patientRegistry.connect(patient).registerPatient("patientCID");
        await providerRegistry.connect(provider).registerHealthcareProvider("providerCID");
        await providerRegistry.connect(owner).verifyHealthcareProvider(await provider.getAddress());

        // Provider requests and gets access approval from the patient
        const purposeHash = ethers.encodeBytes32String("PurposeHash");
        await accessControl.connect(provider).requestAccess(await patient.getAddress(), purposeHash);
        await accessControl.connect(patient).approveAccess(await provider.getAddress());

        // Provider uploads a medical record for the patient
        const recordCID = ethers.toUtf8Bytes("recordCID");
        await medicalRecords.connect(provider).uploadMedicalRecord(await patient.getAddress(), recordCID);

        // Patient retrieves their medical records to verify the upload
        const records = await medicalRecords.connect(patient).getMedicalRecords();
        expect(records.length).to.equal(1);
        expect(records[0].encryptedCID).to.equal(ethers.hexlify(recordCID));
    });

    // Test case: Prevent unauthorized access to retrieve a patient's medical records
    it("should prevent unauthorized access to retrieve a patient's records", async function () {
        // Register the patient
        await patientRegistry.connect(patient).registerPatient("patientCID");

        // Unauthorized provider attempts to access patient records
        await expect(
            medicalRecords.connect(provider).getPatientRecords(await patient.getAddress())
        ).to.be.revertedWith("Caller is not authorized");
    });

    // Test case: Allow authorized providers to retrieve a patient's medical records
    it("should allow authorized provider to retrieve patient's medical records", async function () {
        // Register patient and provider
        await patientRegistry.connect(patient).registerPatient("patientCID");
        await providerRegistry.connect(provider).registerHealthcareProvider("providerCID");
        await providerRegistry.connect(owner).verifyHealthcareProvider(await provider.getAddress());

        // Provider requests and gets access approval from the patient
        const purposeHash = ethers.encodeBytes32String("PurposeHash");
        await accessControl.connect(provider).requestAccess(await patient.getAddress(), purposeHash);
        await accessControl.connect(patient).approveAccess(await provider.getAddress());

        // Provider uploads a medical record for the patient
        const recordCID = ethers.toUtf8Bytes("recordCID");
        await medicalRecords.connect(provider).uploadMedicalRecord(await patient.getAddress(), recordCID);

        // Authorized provider retrieves the patient's medical records
        const records = await medicalRecords.connect(provider).getPatientRecords(await patient.getAddress());
        expect(records.length).to.equal(1);
        expect(records[0].encryptedCID).to.equal(ethers.hexlify(recordCID));
    });
});
