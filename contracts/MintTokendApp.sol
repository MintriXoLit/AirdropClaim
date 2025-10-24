// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MintTokendApp is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    function mint(address _to, uint256 _value) external onlyRole(MINTER_ROLE) {
        _mint(_to, _value);
    }

    function burn(address _account, uint256 _value) external onlyRole(BURNER_ROLE) {
        _burn(_account, _value);
    }

    function burnFrom(address _account, uint256 _value) external {
        _spendAllowance(_account, msg.sender, _value);
        _burn(_account, _value);
    }
}
