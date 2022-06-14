// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IPoseidonHasher {
    function poseidon(uint256[2] calldata inputs) external pure returns (uint256);
}

contract MerkleTreeHistory {
    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint8 public constant ROOT_HISTORY_SIZE = 30;

    IPoseidonHasher public immutable hasher;

    uint8 public levels;
    uint32 public immutable maxSize;
    uint32 public index = 0;

    mapping(uint8 => uint256) public filledSubtrees;
    mapping(uint256 => uint256) public roots;

    constructor(uint8 _levels, IPoseidonHasher _hasher) {
        require(_levels > 0, "_levels should be greater than 0");
        require(_levels < 32, "_levels should not be greater than 32");
        levels = _levels;
        hasher = _hasher;
        maxSize = uint32(2) ** levels;

        for (uint8 i = 0; i < _levels; i++) {
            filledSubtrees[i] = zeros(i);
        }

        roots[0] = zeros(_levels - 1);
    }

    function insert(uint256 leaf) internal returns (uint32) {
        require(index != maxSize, "Merkle tree is full");
        require(leaf < FIELD_SIZE, "Leaf has to be within field size");

        uint32 currentIndex = index;
        uint256 currentLevelHash = leaf;
        uint256 left;
        uint256 right;

        for (uint8 i = 0; i < levels; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros(i);
                filledSubtrees[i] = currentLevelHash;
            } else {
                left = filledSubtrees[i];
                right = currentLevelHash;
            }

            currentLevelHash = hasher.poseidon([left, right]);
            currentIndex /= 2;
        }

        roots[index % ROOT_HISTORY_SIZE] = currentLevelHash;

        index++;
        return index - 1;
    }

    function isValidRoot(uint256 root) public view returns (bool) {
        if (root == 0) {
            return false;
        }

        uint32 currentIndex = index % ROOT_HISTORY_SIZE;
        uint32 i = currentIndex;
        do {
            if (roots[i] == root) {
                return true;
            }

            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        }
        while (i != currentIndex);

        return false;
    }

    function getLastRoot() public view returns (uint256) {
        return roots[index % ROOT_HISTORY_SIZE];
    }

    // poseidon(keccak256("easy-links") % FIELD_SIZE)
    function zeros(uint256 i) public pure returns (uint256) {
        if (i == 0) return 0x1b47eebd31a8cdbc109d42a60ae2f77d3916fdf63e1d6d3c9614c84c66587616;
        else if (i == 1) return 0x0998c45a8df60690d2142a1e29541e4c5203c5f0039e1f736a48a4ea3939996c;
        else if (i == 2) return 0x1b8525aeb12de720fbc32b7a5b505efc1bd4396e223644aed9d48c4ecc5a6451;
        else if (i == 3) return 0x1937e198ced295751ebf9996ad4429473bb657521a76f372ab62eab9dd09f729;
        else if (i == 4) return 0x043fae75b0a1c6cfe6bbd4a260fc421f26cd352974d31d3627896a677f3931a3;
        else if (i == 5) return 0x7c68bad132df37627c5fa5e1c06601d5af97124b0bd19f6e29593e1814ae51;
        else if (i == 6) return 0x2aca3ddb1f0c22cd53383b85231c1a10634f160ce945c639b2b799ed8b37f5ae;
        else if (i == 7) return 0x037ca32d66c15af3f7cb3cbc7d5b0fad9104582d24416fdd85c50586d3079a0e;
        else if (i == 8) return 0x1c9e22b869e38db54e772baa9a4765b9ccb1ea458ea4a50c3ce9ce5152a95581;
        else if (i == 9) return 0x283f3963c14e4a1873557637cf74773b5de1d3dcafa8c2c82f18720fabd5e0f9;
        else if (i == 10) return 0x1f04ef20dee48d39984d8eabe768a70eafa6310ad20849d4573c3c40c2ad1e30;
        else if (i == 11) return 0x1bea3dec5dab51567ce7e200a30f7ba6d4276aeaa53e2686f962a46c66d511e5;
        else if (i == 12) return 0x0ee0f941e2da4b9e31c3ca97a40d8fa9ce68d97c084177071b3cb46cd3372f0f;
        else if (i == 13) return 0x1ca9503e8935884501bbaf20be14eb4c46b89772c97b96e3b2ebf3a36a948bbd;
        else if (i == 14) return 0x133a80e30697cd55d8f7d4b0965b7be24057ba5dc3da898ee2187232446cb108;
        else if (i == 15) return 0x13e6d8fc88839ed76e182c2a779af5b2c0da9dd18c90427a644f7e148a6253b6;
        else if (i == 16) return 0x1eb16b057a477f4bc8f572ea6bee39561098f78f15bfb3699dcbb7bd8db61854;
        else if (i == 17) return 0x0da2cb16a1ceaabf1c16b838f7a9e3f2a3a3088d9e0a6debaa748114620696ea;
        else if (i == 18) return 0x24a3b3d822420b14b5d8cb6c28a574f01e98ea9e940551d2ebd75cee12649f9d;
        else if (i == 19) return 0x198622acbd783d1b0d9064105b1fc8e4d8889de95c4c519b3f635809fe6afc05;
        else if (i == 20) return 0x29d7ed391256ccc3ea596c86e933b89ff339d25ea8ddced975ae2fe30b5296d4;
        else if (i == 21) return 0x19be59f2f0413ce78c0c3703a3a5451b1d7f39629fa33abd11548a76065b2967;
        else if (i == 22) return 0x1ff3f61797e538b70e619310d33f2a063e7eb59104e112e95738da1254dc3453;
        else if (i == 23) return 0x10c16ae9959cf8358980d9dd9616e48228737310a10e2b6b731c1a548f036c48;
        else if (i == 24) return 0x0ba433a63174a90ac20992e75e3095496812b652685b5e1a2eae0b1bf4e8fcd1;
        else if (i == 25) return 0x019ddb9df2bc98d987d0dfeca9d2b643deafab8f7036562e627c3667266a044c;
        else if (i == 26) return 0x2d3c88b23175c5a5565db928414c66d1912b11acf974b2e644caaac04739ce99;
        else if (i == 27) return 0x2eab55f6ae4e66e32c5189eed5c470840863445760f5ed7e7b69b2a62600f354;
        else if (i == 28) return 0x002df37a2642621802383cf952bf4dd1f32e05433beeb1fd41031fb7eace979d;
        else if (i == 29) return 0x104aeb41435db66c3e62feccc1d6f5d98d0a0ed75d1374db457cf462e3a1f427;
        else if (i == 30) return 0x1f3c6fd858e9a7d4b0d1f38e256a09d81d5a5e3c963987e2d4b814cfab7c6ebb;
        else if (i == 31) return 0x2c7a07d20dff79d01fecedc1134284a8d08436606c93693b67e333f671bf69cc;
        else revert("Index out of bounds");
    }
}