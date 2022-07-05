// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Mixup.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

contract ETHMixup is Mixup, ERC2771Context {
    constructor(MinimalForwarder forwarder, IVerifier _verifier, address _hasher, uint256 _denomination, uint32 _merkleTreeHeight) Mixup(_verifier, _hasher, _denomination, _merkleTreeHeight) ERC2771Context(address(forwarder)) {}

    function _processDeposit() internal override {
        require(msg.value == denomination, "Mixup: Please send `mixDenomination` ETH along with transaction");
    }

    function _processWithdraw(address payable _recipient) internal override {
        require(msg.value == 0, "Mixup: Message value is supposed to be zero for ETH");

        (bool success, ) = _recipient.call{value: denomination}("");
        require(success, "Mixup: payment to _recipient was not successful");
    }
}


