// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MintTokendApp is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    
    address public airdrop;
    
    event AirdropSet(address indexed airdrop);
    
    modifier onlyMinter() {
        require(msg.sender == airdrop, "Not authorized");
        _;
    }
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, string memory _symbol) public initializer {
        __ERC20_init(_name, _symbol);
        __Ownable_init(msg.sender);
    }
    
    function setAirdrop(address _airdrop) external onlyOwner {
        require(_airdrop != address(0), "Invalid address");
        require(airdrop == address(0), "Airdrop already set");
        airdrop = _airdrop;
        emit AirdropSet(_airdrop);
    }
    
    function mint(address _to, uint256 _value) external onlyMinter {
        _mint(_to, _value);
    }
    
    function burn(address _account, uint256 _value) external onlyOwner {
        _burn(_account, _value);
    }
    
    function burnFrom(address _account, uint256 _value) external {
        _spendAllowance(_account, msg.sender, _value);
        _burn(_account, _value);
    }
}