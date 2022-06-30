const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {BigNumber} = require("ethers");
const { buildPoseidon, poseidonContract } = require("circomlibjs");
const { MerkleTree } = require('fixed-merkle-tree');
const { PoseidonHasher } = require('./utils/hasher');
const { exportCallDataGroth16 } = require("./utils/utils");

describe("ETHMixup", async function() {
    let MixupVerifier
    let mixupVerifier
    let CommitmentHasher
    let commitmentHasher
    let NullifierHasher
    let nullifierHasher
    let EthMixup
    let ethMixup
    let user
    let addrs
    let levels = 10
    let poseidon

    beforeEach(async function() {
        // deploy verifier contract
        MixupVerifier = await ethers.getContractFactory("Verifier")
        mixupVerifier = await MixupVerifier.deploy()
        await mixupVerifier.deployed();

        // deploy poseidon commitment hasher contract
        CommitmentHasher = await ethers.getContractFactory(
            poseidonContract.generateABI(2),
            poseidonContract.createCode(2)
        )
        commitmentHasher = await CommitmentHasher.deploy();
        await commitmentHasher.deployed();

        // deploy poseidon nullifier hasher contract
        NullifierHasher = await ethers.getContractFactory(
            poseidonContract.generateABI(1),
            poseidonContract.createCode(1)
        )
        nullifierHasher = await NullifierHasher.deploy();
        await nullifierHasher.deployed();

        // deploy ethmixup contract
        EthMixup = await ethers.getContractFactory("ETHMixup")
        ethMixup = await EthMixup.deploy(mixupVerifier.address, commitmentHasher.address, 1, levels)
        await ethMixup.deployed();

        poseidon = new PoseidonHasher(await buildPoseidon());

        [user, ...addrs] = await ethers.getSigners()

    })

    describe("Deposit Test", async function() {

        it("should make no deposit for the wrong denomination", async function() {

            const denomination = 2
            const secret = 1234
            const nullifier = 5678
            const commitment =  await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier]);

            await expect(ethMixup.deposit(commitment, {
                value: denomination,
            })).to.be.revertedWith("Mixup: Please send `mixDenomination` ETH along with transaction")

        })

        it("should deposit commitment for the right denomination", async function() {
            
            const denomination = 1
            const secret = 1234
            const nullifier = 5678
            const commitment =  await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

            const tx = await ethMixup.deposit(commitment, {
                value: denomination,
            })

        })

        it("should not deposit for an already existing commitment", async function() {

            const denomination = 1
            const secret = 1234
            const nullifier = 5678
            const commitment =  await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

            // deposit into tree
            await ethMixup.deposit(commitment, {
                value: denomination,
            })

            // try to make another deposit of same commitment
            await expect(ethMixup.deposit(commitment, {
                value: denomination,
            })).to.be.revertedWith("Mixup: The commitment has been submitted")

        })
    })

    describe("Proof Verification", async function() {
    
        it("should verify proof", async function() {

            // initiate a new merkle tree instance
            const tree = new MerkleTree(levels, [], {
                hashFunction: (secret, nullifier) => poseidon.hash(secret, nullifier).toString()
            });

            const secret = 1234
            const nullifier = 5678
            const commitment =  await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

            // insert commitment into merkle tree
            tree.insert(commitment)

            const { pathElements, pathIndices, pathRoot } = tree.proof(commitment)

            // hash nullifier
            const nullifierHashObject = await nullifierHasher["poseidon(uint256[1])"]([nullifier])

            const input = {
                root: pathRoot,
                nullifier: nullifier,
                secret: secret,
                nullifierHash: nullifierHashObject.toString(),
                pathElements: pathElements,
                pathIndices: pathIndices
            }

            // generate proof data
            let dataResult = await exportCallDataGroth16(
                input,
                "circuits/build/Withdraw_js/Withdraw.wasm",
                "circuits/build/circuit_final.zkey"
            );
          
              // Call the verify proof function
              let result = await mixupVerifier.verifyProof(
                dataResult.a,
                dataResult.b,
                dataResult.c,
                dataResult.Input
              );
              expect(result).to.equal(true);
        })

    })

    describe("Withdrawal", async function() {

        it("should withdraw", async function() {

            const denomination = 1
            const secret = 1234
            const nullifier = 5678
            const commitment =  await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

            // deposit commitment
            await ethMixup.deposit(commitment, {
                value: denomination,
            })

            // initiate a new instance of merkle tree
            const tree = new MerkleTree(levels, [], {
                hashFunction: (secret, nullifier) => poseidon.hash(secret, nullifier).toString(), zeroElement: "12339540769637658105100870666479336797812683353093222300453955367174479050262"
            });

            // insert commitment into merkle tree
            tree.insert(commitment)

            const { pathElements, pathIndices, pathRoot } = tree.proof(commitment)

            // hash nullifier
            const nullifierHashObject = await nullifierHasher["poseidon(uint256[1])"]([nullifier])

            const input = {
                root: pathRoot,
                nullifier: nullifier,
                secret: secret,
                nullifierHash: nullifierHashObject.toString(),
                pathElements: pathElements,
                pathIndices: pathIndices
            }

            // generate proof data
            let dataResult = await exportCallDataGroth16(
                input,
                "circuits/build/Withdraw_js/Withdraw.wasm",
                "circuits/build/circuit_final.zkey"
            );

            // initiate withdraw
            await ethMixup.withdraw(dataResult.a, dataResult.b, dataResult.c, pathRoot, input.nullifierHash, user.address)

        })

        it("should not withdraw same deposit twice", async function() {

            const denomination = 1
            const secret = 1234
            const nullifier = 5678
            const commitment =  await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

            // initiate a new deposit
            await ethMixup.deposit(commitment, {
                value: denomination,
            })

            // initialize a new merkle tree instance
            const tree = new MerkleTree(levels, [], {
                hashFunction: (secret, nullifier) => poseidon.hash(secret, nullifier).toString(), zeroElement: "12339540769637658105100870666479336797812683353093222300453955367174479050262"
            });

            // insert commitment into merkle tree
            tree.insert(commitment)

            const { pathElements, pathIndices, pathRoot } = tree.proof(commitment)

            // hash nullifier
            const nullifierHashObject = await nullifierHasher["poseidon(uint256[1])"]([nullifier])

            const input = {
                root: pathRoot,
                nullifier: nullifier,
                secret: secret,
                nullifierHash: nullifierHashObject.toString(),
                pathElements: pathElements,
                pathIndices: pathIndices
            }

            // get proof data
            let dataResult = await exportCallDataGroth16(
                input,
                "circuits/build/Withdraw_js/Withdraw.wasm",
                "circuits/build/circuit_final.zkey"
            );

            // withdraw deposit
            await ethMixup.withdraw(dataResult.a, dataResult.b, dataResult.c, pathRoot, input.nullifierHash, user.address)

            // try to withdraw same deposit again
            await expect(ethMixup.withdraw(dataResult.a, dataResult.b, dataResult.c, pathRoot, input.nullifierHash, user.address)).to.be.revertedWith("Mixup: The note has already been spent")

        })
        
    })
})
