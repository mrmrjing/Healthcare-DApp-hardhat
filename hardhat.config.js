require("@nomiclabs/hardhat-ethers"); // Import ethers plugin
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
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL || "", // Infura or Alchemy RPC URL
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Private key for deployment
    },
  },
  paths: {
    artifacts: "./artifacts", // Path for compiled artifacts
    sources: "./contracts", // Path for Solidity contracts
    tests: "./test", // Path for test files
    cache: "./cache", // Path for cache
  },
};