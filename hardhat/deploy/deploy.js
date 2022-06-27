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

    // deploy ethmixup contract
    const EthMixup = await hre.ethers.getContractFactory("ETHMixup");
    const ethMixup = await EthMixup.deploy(mixupVerifier.address, commitmentHasher.address, "10000000000000000000", 10);
    await ethMixup.deployed();
    console.log("EthMixup Contract deployed to:", ethMixup.address);

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


// MixupVerifier Contract deployed to: 0x81Dd889fC544B648c6c7D10621158C0B848224a5
// CommitmentHasher Contract deployed to: 0xE9B8072643f80B1869Ae45Bf0Cd8feFF414eb37A
// NullifierHasher Contract deployed to: 0x25C80a382697Ab6547b6946e5cB18a81dECF7438
// EthMixup Contract deployed to: 0xBf4274C6DA999D075b0792918Dc7C6794b0e35E7