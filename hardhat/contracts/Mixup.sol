// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MerkleTreeHistory.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IVerifier {
    function verifyProof(
      uint256[2] calldata a,
      uint256[2][2] calldata b,
      uint256[2] calldata c,
      uint256[2] memory _input
    ) 
    external returns (bool);
}

abstract contract Mixup is MerkleTreeHistory, ReentrancyGuard {
    IVerifier public immutable verifier;
    uint256 public denomination;

    mapping(uint256 => bool) public nullifierHashes;
    mapping(uint256 => bool) public commitments;

    event Deposit(uint256 indexed commitment, uint32 leafIndex, uint256 timestamp);
    event Withdrawal(address to, uint256 nullifierHash);

    /**
        @dev Breakdown of the constructor
        @param _verifier the address of SNARK verifier for this contract
        @param _hasher the address of Poseidon hash contract
        @param _denomination transfer amount for each deposit
        @param _merkleTreeHeight the height of deposits' Merkle Tree
  */

  constructor(IVerifier _verifier, address _hasher, uint256 _denomination, uint32 _merkleTreeHeight) MerkleTreeHistory(_merkleTreeHeight, _hasher) {
      require(_denomination > 0, "Mixup: Denomination should be greater than 0");
      verifier = _verifier;
      denomination = _denomination;
  }

  /**
    @dev Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
    @param _commitment the note commitment, which is a Poseidon hash of(nullifier + secret)
  */

  function deposit(uint256 _commitment) external payable nonReentrant {
    require(!commitments[_commitment], "Mixup: The commitment has been submitted");
    
    uint32 insertedIndex = _insert(_commitment);
    commitments[_commitment] = true;
    _processDeposit();

    emit Deposit(_commitment, insertedIndex, block.timestamp);
  }

  /** @dev this function is defined in a child contract */
  function _processDeposit() internal virtual;

  /**
    @dev Withdraw a deposit from the contract.
  **/
  function withdraw(
      uint256[2] memory a,
      uint256[2][2] memory b,
      uint256[2] memory c,
      uint256 _root,
      uint256 _nullifierHash,
      address payable _recipient
    ) 
    external payable nonReentrant {

      require(!nullifierHashes[_nullifierHash], "Mixup: The note has already been spent");
      require(isKnownRoot(_root), "Mixup: merkle root does not exist");

      require(verifier.verifyProof(
          a,
          b,
          c,
          [uint256(_root), uint256(_nullifierHash)]
      ), "Mixup: Invalid withdraw proof");

      nullifierHashes[_nullifierHash] = true;
      _processWithdraw(_recipient);
      emit Withdrawal(_recipient, _nullifierHash);

  }

  /** @dev this function is defined in a child contract */
  function _processWithdraw(address payable _recipient) internal virtual;

  /** @dev whether a note is already spent */
  function isSpent(uint256 _nullifierHash) public view returns (bool) {
    return nullifierHashes[_nullifierHash];
  }

  /** @dev whether an array of notes is already spent */
  function isSpentArray(uint256[] calldata _nullifierHashes) external view returns (bool[] memory spent) {
    spent = new bool[](_nullifierHashes.length);
    for (uint256 i = 0; i < _nullifierHashes.length; i++) {
      if (isSpent(_nullifierHashes[i])) {
        spent[i] = true;
      }
    }
  }

}