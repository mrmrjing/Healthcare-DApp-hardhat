const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying PatientRegistry...");
    const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
    const patientRegistry = await PatientRegistry.deploy(); // Deploy contract
    await patientRegistry.waitForDeployment(); // ethers v6 method
    console.log("PatientRegistry deployed to:", await patientRegistry.getAddress());

    console.log("Deploying HealthcareProviderRegistry...");
    const HealthcareProviderRegistry = await ethers.getContractFactory("HealthcareProviderRegistry");
    const healthcareProviderRegistry = await HealthcareProviderRegistry.deploy();
    await healthcareProviderRegistry.waitForDeployment();
    console.log("HealthcareProviderRegistry deployed to:", await healthcareProviderRegistry.getAddress());

    console.log("Deploying AccessControl...");
    const AccessControl = await ethers.getContractFactory("AccessControl");
    const accessControl = await AccessControl.deploy(
        await patientRegistry.getAddress(),
        await healthcareProviderRegistry.getAddress()
    );
    await accessControl.waitForDeployment();
    console.log("AccessControl deployed to:", await accessControl.getAddress());

    console.log("Deploying MedicalRecords...");
    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    const medicalRecords = await MedicalRecords.deploy(await accessControl.getAddress());
    await medicalRecords.waitForDeployment();
    console.log("MedicalRecords deployed to:", await medicalRecords.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
