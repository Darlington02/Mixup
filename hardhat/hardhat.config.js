require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
const fs = require("fs");

// Replace this private key with your Harmony account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Be aware of NEVER putting real Ether into testing accounts
const HARMONY_PRIVATE_KEY = fs.readFileSync(".secret").toString();

module.exports = {
    solidity: {
        compilers: [
          {
            version: "0.8.4",
          },
          {
            version: "0.8.9",
            settings: {},
          },
        ],

        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    networks: {
        hardhat: {
            gas: 100000000,
            blockGasLimit: 0x1fffffffffffff
        },
        testnet: {
            url: "https://api.s0.b.hmny.io",
            chainId: 1666900000,
            accounts: [`${HARMONY_PRIVATE_KEY}`]
        },
        devnet: {
            url: "https://api.s0.ps.hmny.io/",
            chainId: 1666900000,
            accounts: [`${HARMONY_PRIVATE_KEY}`]
        },
        mainnet: {
            url: "https://api.harmony.one",
            chainId: 1666600000,
            accounts: [`${HARMONY_PRIVATE_KEY}`]
        },
        rinkeby: {
            url: "https://rinkeby.infura.io/v3/b19d3eeaef24491ea6536fd4a48fbd20",
            accounts: [`${HARMONY_PRIVATE_KEY}`]
        }
    },
    
    mocha: {
        timeout: 1000000
    }
};
