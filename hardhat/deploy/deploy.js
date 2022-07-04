const { buildPoseidon, poseidonContract } = require("circomlibjs");

const main = async () => {

    // deploy verifier contract
    const MixupVerifier = await hre.ethers.getContractFactory("Verifier");
    const mixupVerifier = await MixupVerifier.deploy();
    await mixupVerifier.deployed();
    console.log("MixupVerifier Contract deployed to:", mixupVerifier.address);

    // deploy commitmenthasher
    const CommitmentHasher = await hre.ethers.getContractFactory(
        poseidonContract.generateABI(2),
        poseidonContract.createCode(2)
    );
    const commitmentHasher = await CommitmentHasher.deploy();
    await commitmentHasher.deployed();
    console.log("CommitmentHasher Contract deployed to:", commitmentHasher.address);

    // deploy nullifierhasher
    const NullifierHasher = await hre.ethers.getContractFactory(
        poseidonContract.generateABI(1),
        poseidonContract.createCode(1)
    );
    const nullifierHasher = await NullifierHasher.deploy();
    await nullifierHasher.deployed();
    console.log("NullifierHasher Contract deployed to:", nullifierHasher.address);

    // deploy forwarder contract
    const Forwarder = await hre.ethers.getContractFactory("MinimalForwarder")
    const forwarder = await Forwarder.deploy();

    // deploy ethmixup contract [10 ONE POOL]
    const EthMixup1 = await hre.ethers.getContractFactory("ETHMixup");
    const ethMixup1 = await EthMixup1.deploy(forwarder.address, mixupVerifier.address, commitmentHasher.address, "10000000000000000000", 10);
    await ethMixup1.deployed();
    console.log("EthMixup [10 ONE] Contract deployed to:", ethMixup1.address);
  
    // deploy ethmixup contract [1000 ONE POOL]
    const EthMixup2 = await hre.ethers.getContractFactory("ETHMixup");
    const ethMixup2 = await EthMixup2.deploy(forwarder.address, mixupVerifier.address, commitmentHasher.address, "1000000000000000000000", 10);
    await ethMixup2.deployed();
    console.log("EthMixup [1000 ONE] Contract deployed to:", ethMixup2.address);

    // deploy ethmixup contract [5000 ONE POOL]
    const EthMixup3 = await hre.ethers.getContractFactory("ETHMixup");
    const ethMixup3 = await EthMixup3.deploy(forwarder.address, mixupVerifier.address, commitmentHasher.address, "5000000000000000000000", 10);
    await ethMixup3.deployed();
    console.log("EthMixup [5000 ONE] Contract deployed to:", ethMixup3.address);

    // deploy ethmixup contract [10000 ONE POOL]
    const EthMixup4 = await hre.ethers.getContractFactory("ETHMixup");
    const ethMixup4 = await EthMixup4.deploy(forwarder.address, mixupVerifier.address, commitmentHasher.address, "10000000000000000000000", 10);
    await ethMixup4.deployed();
    console.log("EthMixup [10000 ONE] Contract deployed to:", ethMixup4.address);

    // deploy ethmixup contract [50000 ONE POOL]
    const EthMixup5 = await hre.ethers.getContractFactory("ETHMixup");
    const ethMixup5 = await EthMixup5.deploy(forwarder.address, mixupVerifier.address, commitmentHasher.address, "50000000000000000000000", 10);
    await ethMixup5.deployed();
    console.log("EthMixup [50000] Contract deployed to:", ethMixup5.address);

};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
