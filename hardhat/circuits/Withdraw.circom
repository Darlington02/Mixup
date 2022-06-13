pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "Merkletree.circom";

template CommitmentHasher() {
    // signal definitions
    signal input secret;
    signal input nullifier;
    signal output commitment;
    signal output nullifierHash;

    // create commitment by hashing secret and nullifier
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifier;
    commitment <== commitmentHasher.out;

    // create hash of nullifier
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash <== nullifierHasher.out;
}

template Withdraw(levels) {
    // signal definitions
    signal input root;
    signal input nullifier;
    signal input secret;
    signal input nullifierHash;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // initialize and pass signal values to CommitmentHasher template
    component hasher = CommitmentHasher();
    hasher.nullifier <== nullifier;
    hasher.secret <== secret;
    hasher.nullifierHash === nullifierHash;

    // initialize and check for commitment in merkle tree
    component tree = MerkleProof(levels);
    tree.leaf <== hasher.commitment;
    tree.root <== root;

    for(var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
}

component main { public[root, nullifierHash] } = Withdraw(20);

