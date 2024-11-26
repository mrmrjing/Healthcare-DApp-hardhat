const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addresses = {}; // Object to store deployed addresses

    const [deployer] = await ethers.getSigners(); // Get the deployer's address
    console.log("Deploying contracts with account:", deployer.address);
    addresses.Deployer = deployer.address; // Store the deployer's address as admin

    console.log("Deploying PatientRegistry...");
    const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
    const patientRegistry = await PatientRegistry.deploy();
    await patientRegistry.waitForDeployment();
    const patientRegistryAddress = await patientRegistry.getAddress();
    console.log("PatientRegistry deployed to:", patientRegistryAddress);
    addresses.PatientRegistry = patientRegistryAddress;

    console.log("Deploying HealthcareProviderRegistry...");
    const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
    const healthcareProviderRegistry = await HealthcareProviderRegistry.deploy();
    await healthcareProviderRegistry.waitForDeployment();
    const healthcareProviderRegistryAddress = await healthcareProviderRegistry.getAddress();
    console.log("HealthcareProviderRegistry deployed to:", healthcareProviderRegistryAddress);
    addresses.HealthcareProviderRegistry = healthcareProviderRegistryAddress;

    console.log("Deploying AccessControl...");
    const AccessControl = await ethers.getContractFactory("AccessControl");
    const accessControl = await AccessControl.deploy(
        patientRegistryAddress,
        healthcareProviderRegistryAddress
    );
    await accessControl.waitForDeployment();
    const accessControlAddress = await accessControl.getAddress();
    console.log("AccessControl deployed to:", accessControlAddress);
    addresses.AccessControl = accessControlAddress;

    console.log("Deploying MedicalRecords...");
    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    const medicalRecords = await MedicalRecords.deploy(accessControlAddress);
    await medicalRecords.waitForDeployment();
    const medicalRecordsAddress = await medicalRecords.getAddress();
    console.log("MedicalRecords deployed to:", medicalRecordsAddress);
    addresses.MedicalRecords = medicalRecordsAddress;

    // Save deployed contract addresses and admin to a JSON file
    const filePath = path.join(__dirname, "../frontend/src/artifacts/deployedAddresses.json");
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
    console.log("Deployed addresses saved to:", filePath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
