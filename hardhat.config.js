require("@nomicfoundation/hardhat-ethers");  // Import ethers plugin
require("@nomicfoundation/hardhat-chai-matchers");

require("dotenv").config(); // Load environment variables from a .env file


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.0", // Solidity compiler version
    settings: {
      optimizer: {
        enabled: true, 
        runs: 200, 
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Local Hardhat node URL
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: process.env.PRIVATE_KEYS.split(","),
    },
  },
  paths: {
    artifacts: "./frontend/src/artifacts", // Path for compiled artifacts
    sources: "./contracts", // Path for Solidity contracts
    tests: "./test", // Path for test files
    cache: "./cache", // Path for cache
  },
};