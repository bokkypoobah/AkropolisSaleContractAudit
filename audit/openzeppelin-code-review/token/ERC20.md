# ERC20

Source file [../../openzeppelin-contracts/token/ERC20.sol](../../openzeppelin-contracts/token/ERC20.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;


// BK Ok
import './ERC20Basic.sol';


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
// BK Ok
contract ERC20 is ERC20Basic {
  // BK Ok
  function allowance(address owner, address spender) public view returns (uint256);
  // BK Ok
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  // BK Ok
  function approve(address spender, uint256 value) public returns (bool);
  // BK Ok - Event
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

```
