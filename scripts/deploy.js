// Import the ethers.js library
const { ethers } = require("hardhat");

async function main() {
    // Deploy AccessControl.sol
    console.log("Deploying AccessControl...");
    const AccessControl = await ethers.getContractFactory("AccessControl"); // Get the contract factory
    const accessControl = await AccessControl.deploy(); // Deploy the contract
    await accessControl.deployed(); // Wait until deployment is complete
    console.log("AccessControl deployed to:", accessControl.address);

    // Deploy PatientRegistry.sol
    console.log("Deploying PatientRegistry...");
    const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
    const patientRegistry = await PatientRegistry.deploy(); // Deploy the contract
    await patientRegistry.deployed();
    console.log("PatientRegistry deployed to:", patientRegistry.address);

    // Deploy HealthcareProviderRegistry.sol
    console.log("Deploying HealthcareProviderRegistry...");
    const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
    const healthcareProviderRegistry = await HealthcareProviderRegistry.deploy(); // Deploy the contract
    await healthcareProviderRegistry.deployed();
    console.log("HealthcareProviderRegistry deployed to:", healthcareProviderRegistry.address);

    // Deploy MedicalRecords.sol with dependency on AccessControl.sol
    console.log("Deploying MedicalRecords...");
    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    const medicalRecords = await MedicalRecords.deploy(accessControl.address); // Pass AccessControl address to the constructor
    await medicalRecords.deployed();
    console.log("MedicalRecords deployed to:", medicalRecords.address);
}

main()
    .then(() => process.exit(0)) // Exit process after successful execution
    .catch((error) => {
        console.error(error); // Log any errors
        process.exit(1); // Exit process with failure code
    });
