# Mixup - ZK PRIVATE MIXER 

Mixup is a non-custodial Ethereum and ERC20 privacy solution based on zkSNARKs. It improves transaction privacy by breaking the on-chain link between the recipient and destination addresses. It uses a smart contract that accepts ETH deposits that can be withdrawn by a different address. Whenever ETH is withdrawn by the new address, there is no way to link the withdrawal to the deposit, ensuring complete privacy.

To make a deposit user generates a secret and sends its hash (called a commitment) along with the deposit amount to the Tornado smart contract. The contract accepts the deposit and adds the commitment to its list of deposits.

Later, the user decides to make a withdrawal. To do that, the user should provide a proof that he or she possesses a secret to an unspent commitment from the smart contract’s list of deposits. zkSnark technology allows that to happen without revealing which exact deposit corresponds to this secret. The smart contract will check the proof and transfer deposited funds to the address specified for withdrawal. An external observer will be unable to determine which deposit this withdrawal came from.

This project takes alot of inspiration from the popular Tornado Cash Mixer

You can read more about it in [this Medium article](https://medium.com/@tornado.cash/introducing-private-transactions-on-ethereum-now-42ee915babe0)


## Getting Started

Run npm i to install. Check out package.json for other commands to compile circuits and contracts.

To deploy on Harmony testnet, run the above command first, then change the private key in hardhat.config.js to your own private key (Please be careful not to include your private key in any commit!). The contracts have also been deployed to the addresses to deployed.txt and can be accessed directly.

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

Run tests:

```
   yarn test
```

Run coverage:

```
   yarn coverage
```
