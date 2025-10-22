// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
    
contract MintToken is Initializable,ERC20Upgradeable, OwnableUpgradeable {
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    event TokensClaimed(address indexed claimant, uint256 amount);
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    constructor(){
        _disableInitializers();
    }
    function initialize(string memory _name, string memory _symbol, bytes32 _merkleRoot) public initializer {
        __ERC20_init(_name, _symbol);
        __Ownable_init(msg.sender);
        merkleRoot = _merkleRoot;
    }
    function mint(address _to, uint256 _value) public onlyOwner {
        _mint(_to, _value);
    }
    function burn(address _account, uint256 _value) public onlyOwner {
        _burn(_account, _value);
    }
    function burnFrom(address _account, uint256 _value) external {
        _spendAllowance(_account, msg.sender, _value);
        _burn(_account, _value);
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        require(!hasClaimed[msg.sender], "Already claimed");

        // Create leaf from msg.sender and amount
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[msg.sender] = true;
        _mint(msg.sender, amount);
        
        emit TokensClaimed(msg.sender, amount);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }
}