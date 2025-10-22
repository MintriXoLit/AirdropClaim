// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintToken {
    function mint(address to, uint256 amount) external;
}

contract AirdropClaim is Ownable {
    
    IMintToken public immutable token;
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    event TokensClaimed(address indexed claimant, uint256 amount);
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    constructor(address _token, bytes32 _merkleRoot) Ownable(msg.sender) {
        token = IMintToken(_token);
        merkleRoot = _merkleRoot;
    }
    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf),"Invalid proof");
        hasClaimed[msg.sender] = true;
        token.mint(msg.sender, amount);
        emit TokensClaimed(msg.sender, amount);
    }
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }
}