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

- Check ethers.js version: 
```bash
npm list ethers` 
```

- If you face any bugs with wallet address showing 0 balance or weird interactions with connect wallet, just reinstall metamask
Especially error code like this: 
MetaMask - RPC Error: Internal JSON-RPC error. 
{code: -32603, message: 'Internal JSON-RPC error.', data: {…}, stack: '{\n  "code": -32603,\n  "message": "Internal JSON-RP…hfbeogaeaoehlefnkodbefgpgknn/common-1.js:1:210555'}

OR 
change to a different network, then change back to the local hardhat network in metamask
and clear activity for each individual wallet 
remember to log out of each account first
due to the log in state still saved for some reason
https://ethereum.stackexchange.com/questions/109625/received-invalid-block-tag-87-latest-block-number-is-0


# Progress Check 011224 
- Patient/Healthcare Provider registration + linkage to IPFS done 
- Providers able to request access for a specific patient's medical records + include purpose 
- Patients able to upload encrypted files to IPFS 
- Have yet to check patient functionality to grant access to specific healthcare provider 
- Have yet to check provider's retrieval of decryption key when patient grants access