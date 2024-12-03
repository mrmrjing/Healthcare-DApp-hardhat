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

- Patient receives approve access granted successfully, havent yet to check with provider's end, need to check retrieve key to obtain the decryption key 

# Progress Check 021224 
## Patient side: 
### Uploading medical records: 
- Derive a symmetric key from the master password
- Encrypt the uploaded medical record with the symmetric key 
- Upload the encrypted medical record to IPFS 
- Store the CID on the blockchain 

### Granting access: 
- Rederive the symmetric key from the master password 
- Perform an ECDH key exchange with the doctor's public key to dervie a shared secret 
- Encrypt the symmetric key with the shared secret 
- Send this encrypted symmetric key to the doctor via the blockchain, along with the list of CIDs the doctor is allowed to access (should remove this part)

## Doctor side: 
### Request Access: 
- Send an access request to the patient 
### Retrieve and decrypt the symmetric key 
- Retrieve the encrypted symmetric key from the blockchain 
- Perform ECDH to derive the shared secret 
- Decrypt the symmetric key using the shared secret 

### Accessing medical records 
- Use the decrypted symmetric key to decrypt the patient's medical records 

# Progress Check 031224 
-  User (patient/provider) registration and registration details stored on IPFS completed 
- Admin able to verify the provider's registration based on the cid (able to track the registration details)
- Patient able to upload a file into ipfs, and encrypt it using a master password
- Providers able to request access for a specific patient by sending a request 
- Patients able to specifiy which CID of the records that they want to grant access to. Also able to revoke access. 
- Patients grant access: Sends the encrypted symmetric key over using the regenerated symmetric key from the master password 
- Providers request access: Receives the encrypted symmetric key, decrypts it using their private key 
- Providers able to view the decrypted PDF file 

## TODO: 
- Fix insecure key management by using metamask wallet for all signing and encryptions, shouldn't be able to get patients to input their master password to generate the symmetric key, or for a provider to input their private key to obtain the decryption key
- Fix using fixed IVs and salts for AES encryption and decryption to generating it dynamicaly, prepend the IV to ciphertext so that it can be used during decryption 
- Remove storing of encryption keys in localstorage and use metamask to manage the encryption keys 
- Add more robuts error handling to prevent unhandled errors and sudden crashes 
- Code refactoring to ensure consistent coding practices (use ES6 instead of ES5)
- Test smart contracts for security issues and bugs!!
- Add unit tests for frontend using Jest 
- Improve UI of app