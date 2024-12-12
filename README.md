## Setup

To get started with the project, follow these steps:

### 1. Clone the repository
If you haven’t already cloned the repository, do so using:
```bash
git clone https://github.com/mrmrjing/Healthcare-DApp-hardhat
cd Healthcare-DApp-hardhat
```

### 2. Install all required dependencies
```bash
npm install 
```

### 3. Common Hardhat Commands
- Start the Hardhat local network: 
```bash
npx hardhat node
```

- Compile the contracts: 
```bash
npx hardhat compile
```

- To deploy the contracts to a specified network (local,testnet): 
```bash
npx hardhat run scripts/deploy.js --network <network-name>
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/deploy.js --network rinkeby
npx hardhat run scripts/deploy.js --network sepolia
```

- To run unit tests: 
```bash
npx hardhat test
```

- To run a specific test: 
```bash
npx hardhat test test/PatientRegistry.test.js
```

- To clean the cached builds: 
```bash
npx hardhat clean
```

### 3. IPFS Setup
- To install IPFS on MacOS: 
```bash
brew install ipfs
```

- ipfs-http-client has to be v48.2.0 or lower 

- To install IPFS on Windows: 
```bash 
https://docs.ipfs.tech/install/ipfs-desktop/#windows
```

- To run the IPFS daemon to start the local node: 
```bash
ipfs daemon
```

- To allow IPFS node to allow HTTP requests frome external sources 
```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST", "PUT"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
```

- To completely clean IPFS directory: 
```bash
rm -rf ~/.ipfs
```

- Reinitialise IPFS repository: 
```bash 
ipfs init 
```

- Check ethers.js version: 
```bash
npm list ethers` 
```

### Troubleshooting MetaMask Issues 
If you encounter issues such as a zero wallet balance or connection problems, try the following:

- Reinstall MetaMask
- Switch to a different network, then back to the local Hardhat network
- Clear activity for each wallet:

