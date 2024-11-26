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
```

- To run unit tests: 
```bash
npx hardhat test
```

- To run a specific test: 
```bash
npx hardhat test test/PatientRegistry.test.js
```

- To downgrade Node.js version to run tests, 
```bash
nvm install 16 
nvm use 16
```

- To clean the cached builds: 
```bash
npx hardhat clean
```

- To install IPFS on MacOS: 
```bash
brew install ipfs
```

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

- If you face any bugs with wallet address showing 0 balance or weird interactions with connect wallet, just reinstall metamask" 
Especially error code like this: 
MetaMask - RPC Error: Internal JSON-RPC error. 
{code: -32603, message: 'Internal JSON-RPC error.', data: {…}, stack: '{\n  "code": -32603,\n  "message": "Internal JSON-RP…hfbeogaeaoehlefnkodbefgpgknn/common-1.js:1:210555'}
