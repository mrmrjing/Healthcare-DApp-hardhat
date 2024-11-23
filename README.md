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

- To clean the cached builds: 
```bash
npx hardhat clean
```