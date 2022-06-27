# Mixup - ZK PRIVATE MIXER 

![zkMixupImage](https://pbs.twimg.com/media/FWR8_UCWIAAUTo_?format=jpg&name=small)

Mixup is a non-custodial privacy solution based on zkSNARKs. It improves transaction privacy by breaking the on-chain link between the recipient and destination addresses. It uses a smart contract that accepts ONE deposits that can be withdrawn by a different address. Whenever ONE is withdrawn by the new address, there is no way to link the withdrawal to the deposit, ensuring complete privacy.

To make a deposit user generates a secret and sends its hash (called a commitment) along with the deposit amount to the Mixup smart contract. The contract accepts the deposit and adds the commitment to its list of deposits.

Later, the user decides to make a withdrawal. To do that, the user should provide a proof that he or she possesses a secret to an unspent commitment from the smart contract’s list of deposits. zkSnark technology allows that to happen without revealing which exact deposit corresponds to this secret. The smart contract will check the proof and transfer deposited funds to the address specified for withdrawal. An external observer will be unable to determine which deposit this withdrawal came from.

This project takes alot of inspiration from the popular Tornado Cash Mixer

You can read more about it in [this Medium article](https://medium.com/@tornado.cash/introducing-private-transactions-on-ethereum-now-42ee915babe0)


## Getting Started

Run npm i to install. Check out package.json for other commands to compile circuits and contracts.

To deploy on Harmony testnet, run the above command first, create a .secret file with your own private key (Please be careful not to include your private key in any commit!). 

## Requirements

1. `node v11.15.0`
2. `npm install -g npx`

## Commands

Prepare test environment:

```
   npm run compile:circuits
   npm run compile:contracts
   npm run deploy:localhost
   npm run test
   npm run test:full
```

The project has three main folders:

- hardhat - [circuits, contracts]
- ui

### circuits

The circuit folder contains all the circuits used in Mixup.

### contracts

The contracts folder contains all the smart contracts used in Mixup.

### ui

The ui folder contains the Mixup frontend.

## Zero Knowledge Structure

The following graphic shows the structure of the most important zero knowledge elements of the Mixup project.

```text
├── circuits
│   ├── Merkletree.circom
│   │  
│   ├── Withdraw.circom
├── contracts
│   ├── contracts
│   │   ├── Mixup(deposit and withdrawals)
│   │   │   ├── ERC20Mixup.sol
│   │   │   ├── ETHMixup.sol
|   |   |   ├── ETHMixup.sol
│   │   ├── MerkleTree (Merkle tree with history)
│   │   │   ├── MerkleTreeHistory.sol
│   │   ├── Verifier (verifies proof)
│   │   │   ├── verifier.sol
├── ui
│   ├── public
│   │   ├── zkproof
│   │   │   ├── Withdraw.wasm
│   │   │   │── circuit_final.zkey
│   │   │
│   ├── zkproof
│   │   ├── snarkjsZkproof.js
│   │   ├
```

## Run Locally

### Clone the Repository

```bash
git clone https://github.com/Darlington02/Mixup.git
```

### Run circuits

To run cicuits, go inside the `circuits` folder:

```bash
cd circuits
npm run compile:circuits
```

### Run contracts

To run contracts, go inside the `contracts` folder:

```bash
cd contracts
npm run compile:contracts
```

### Run ui

To run the frontend, go inside the `ui` folder:

```bash
cd ui
```