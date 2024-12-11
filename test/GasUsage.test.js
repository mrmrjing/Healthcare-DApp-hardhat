const { toUtf8Bytes } = require("ethers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Usage Tests", function () {
    let patientRegistry, providerRegistry, accessControl, medicalRecords;
    let owner, addr1

    // Setup for each test case
    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        // Deploy PatientRegistry contract
        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        patientRegistry = await PatientRegistry.deploy();
        await patientRegistry.waitForDeployment();

        // Deploy HealthcareProviderRegistry contract
        const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        providerRegistry = await HealthcareProviderRegistry.deploy();
        await providerRegistry.waitForDeployment();

        // Deploy AccessControl contract
        const AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy(
            await patientRegistry.getAddress(),
            await providerRegistry.getAddress()
        );
        await accessControl.waitForDeployment();

        // Deploy MedicalRecords contract
        const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
        medicalRecords = await MedicalRecords.deploy(await accessControl.getAddress());
        await medicalRecords.waitForDeployment();
    });

    it("should calculate gas usage for requestAccess", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        const tx = await accessControl.connect(addr1).requestAccess(owner.address, "Consultation");
        const receipt = await tx.wait();
        console.log("Gas used for requestAccess:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for approveAccess", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        await patientRegistry.connect(owner).registerPatient("patientCID1");
        await accessControl.connect(addr1).requestAccess(owner.address, "Consultation");

        const encryptedKey = toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        const tx = await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);
        const receipt = await tx.wait();
        console.log("Gas used for approveAccess:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for revokeAccess", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        await patientRegistry.connect(owner).registerPatient("patientCID1");
        await accessControl.connect(addr1).requestAccess(owner.address, "Consultation");

        const encryptedKey = toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);

        const tx = await accessControl.connect(owner).revokeAccess(addr1.address);
        const receipt = await tx.wait();
        console.log("Gas used for revokeAccess:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for registerPatient", async function () {
        const tx = await patientRegistry.connect(owner).registerPatient("patientCID1");
        const receipt = await tx.wait();
        console.log("Gas used for registerPatient:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for registerHealthcareProvider", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        const tx = await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        const receipt = await tx.wait();
        console.log("Gas used for registerHealthcareProvider:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for verifyHealthcareProvider", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);

        const tx = await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);
        const receipt = await tx.wait();
        console.log("Gas used for verifyHealthcareProvider:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for rejectHealthcareProvider", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);

        const tx = await providerRegistry.connect(owner).rejectHealthcareProvider(addr1.address);
        const receipt = await tx.wait();
        console.log("Gas used for rejectHealthcareProvider:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for uploadMedicalRecord", async function () {
        const publicKey = toUtf8Bytes("providerPublicKey1");
        await providerRegistry.connect(addr1).registerHealthcareProvider("providerCID1", publicKey);
        await providerRegistry.connect(owner).verifyHealthcareProvider(addr1.address);

        await patientRegistry.connect(owner).registerPatient("patientCID1");
        await accessControl.connect(addr1).requestAccess(owner.address, "Consultation");

        const encryptedKey = toUtf8Bytes("encrypted_key");
        const cid = "QmEncryptedDataCID";
        await accessControl.connect(owner).approveAccess(addr1.address, encryptedKey, cid);

        const tx = await medicalRecords.connect(addr1).uploadMedicalRecord(owner.address, "QmMedicalRecordCID");
        const receipt = await tx.wait();
        console.log("Gas used for uploadMedicalRecord:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for deploying PatientRegistry", async function () {
        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        const patientRegistryDeployment = await PatientRegistry.deploy();
        const receipt = await patientRegistryDeployment.deploymentTransaction().wait();
        console.log("Gas used for deploying PatientRegistry:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for deploying HealthcareProviderRegistry", async function () {
        const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        const providerRegistryDeployment = await HealthcareProviderRegistry.deploy();
        const receipt = await providerRegistryDeployment.deploymentTransaction().wait();
        console.log("Gas used for deploying HealthcareProviderRegistry:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for deploying AccessControl", async function () {
        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        const patientRegistry = await PatientRegistry.deploy();
        await patientRegistry.deploymentTransaction().wait();

        const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        const providerRegistry = await HealthcareProviderRegistry.deploy();
        await providerRegistry.deploymentTransaction().wait();

        const AccessControl = await ethers.getContractFactory("AccessControl");
        const accessControlDeployment = await AccessControl.deploy(
            await patientRegistry.getAddress(),
            await providerRegistry.getAddress()
        );
        const receipt = await accessControlDeployment.deploymentTransaction().wait();
        console.log("Gas used for deploying AccessControl:", receipt.gasUsed.toString());
    });

    it("should calculate gas usage for deploying MedicalRecords", async function () {
        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        const patientRegistry = await PatientRegistry.deploy();
        await patientRegistry.deploymentTransaction().wait();

        const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
        const providerRegistry = await HealthcareProviderRegistry.deploy();
        await providerRegistry.deploymentTransaction().wait();

        const AccessControl = await ethers.getContractFactory("AccessControl");
        const accessControlDeployment = await AccessControl.deploy(
            await patientRegistry.getAddress(),
            await providerRegistry.getAddress()
        );
        await accessControlDeployment.deploymentTransaction().wait();

        const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
        const medicalRecordsDeployment = await MedicalRecords.deploy(await accessControlDeployment.target);
        const receipt = await medicalRecordsDeployment.deploymentTransaction().wait();
        console.log("Gas used for deploying MedicalRecords:", receipt.gasUsed.toString());
    });
});
