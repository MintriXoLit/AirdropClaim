// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IMintToken {
    function mint(address to, uint256 amount) external;
}

/**
 * @title AirdropClaim
 * @notice UUPS upgradeable contract for claiming airdrop tokens via Merkle proof
 * @dev Uses AccessControl for admin functions
 */
contract AirdropClaim is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
    // State variables
    IMintToken public token;
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;

    // Events
    event TokensClaimed(address indexed claimant, uint256 amount);
    event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event Initialized(address indexed token, bytes32 indexed merkleRoot);

    // Errors
    error InvalidTokenAddress();
    error AlreadyClaimed();
    error InvalidProof();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract
     * @param tokenAddress Address of the token contract
     * @param initialMerkleRoot Initial merkle root for airdrop verification
     */
    function initialize(address tokenAddress, bytes32 initialMerkleRoot) public initializer {
        if (tokenAddress == address(0)) revert InvalidTokenAddress();

        token = IMintToken(tokenAddress);
        merkleRoot = initialMerkleRoot;

        __UUPSUpgradeable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        emit Initialized(tokenAddress, initialMerkleRoot);
    }

    /**
     * @notice Authorizes contract upgrade
     * @dev Only admin can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice Claims airdrop tokens
     * @param amount Amount of tokens to claim
     * @param merkleProof Merkle proof for verification
     */
    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) revert InvalidProof();

        hasClaimed[msg.sender] = true;
        token.mint(msg.sender, amount);

        emit TokensClaimed(msg.sender, amount);
    }

    /**
     * @notice Updates merkle root
     * @param _merkleRoot New merkle root
     * @dev Only admin can call this function
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 oldRoot = merkleRoot;
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(oldRoot, _merkleRoot);
    }

    /**
     * @notice Returns the version of the contract
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
    // reserve storage for future upgrades
    uint256[45] private __gap;
}
