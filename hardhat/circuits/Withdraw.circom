pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template proveSecret(n) {
    signal input secret;
    signal input hashedSecret[n];
    signal input nullifier;
    signal generatedSecret;
    signal generatedNullifier;

    component poseidonForSecret = Poseidon(1);
    poseidonForSecret.inputs[0] <== secret;
    generatedSecret <== poseidonForSecret.out;

    component poseidonForNullifier = Poseidon(1);
    poseidonForNullifier.inputs[0] <== generatedSecret;
    generatedNullifier <== poseidonForNullifier.out;

    component findSecret[n];
    signal secretFound[n];

    for(var i = 0; i < n; i++){
        findSecret[i] = IsEqual();
        findSecret[i].in[0] <== secret;
        findSecret[i].in[1] <== hashedSecret[i];

        secretFound[i] <== findSecret[i].out;

        secret === secretFound[i];
    }

    nullifier === generatedNullifier;
}

component main = proveSecret(10);

