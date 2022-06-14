// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Mixup.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ERC20Mixup is Mixup {
    using SafeERC20 for IERC20;
    IERC20 public token;
    
    constructor(IVerifier _verifier, IPoseidonHasher _hasher, uint256 _denomination, uint8 _merkleTreeHeight, IERC20 _token) Mixup(_verifier, _hasher, _denomination, _merkleTreeHeight) {
        token = _token;
    }

    function _processDeposit() internal override {
        require(msg.value == 0, "Mixup: ETH value is supposed to be 0 for ERC20 instance");
        token.safeTransferFrom(msg.sender, address(this), denomination);
    }

    function _processWithdraw(address payable _recipient) internal override {
        token.safeTransfer(_recipient, denomination);
    }
}