const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { poseidonContract } = require("circomlibjs");
const { MerkleTree } = require('fixed-merkle-tree')
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
    let levels = 16
    let tree

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
        ethMixup = await EthMixup.deploy(mixupVerifier.address, commitmentHasher.address, 1, 10)
        await ethMixup.deployed();

        tree = new MerkleTree(levels);

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

            console.log(tx)
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

    describe("Verify Proof", async function() {
    
        it("should withdraw", async function() {
            
            const denomination = 1
            const secret = 1234
            const nullifier = 5678
            const commitment =  await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])
        
            tree.insert(commitment)

            await ethMixup.deposit(commitment, {
                value: denomination,
            })

            const { pathElements, pathIndices, pathRoot } = tree.path(0)

            const input = {
                root: pathRoot,
                nullifierHash: await nullifierHasher["poseidon(uint256[1])"]([nullifier]),
                // private inputs
                nullifier: nullifier,
                secret: secret,
                pathElements: pathElements,
                pathIndices: pathIndices
            }

            let dataResult = await exportCallDataGroth16(
                input,
                "circuits/build/Withdraw_js/Withdraw.wasm",
                "circuits/build/circuit_final.zkey"
              );
          
              // Call the function.
              let result = await mixupVerifier.verifyProof(
                dataResult.a,
                dataResult.b,
                dataResult.c,
                dataResult.Input
              );
              expect(result).to.equal(true);
        })

    })
})
