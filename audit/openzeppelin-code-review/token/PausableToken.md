# PausableToken

Source file [../../openzeppelin-contracts/token/PausableToken.sol](../../openzeppelin-contracts/token/PausableToken.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 2 Ok
import './StandardToken.sol';
import '../lifecycle/Pausable.sol';

/**
 * @title Pausable token
 *
 * @dev StandardToken modified with pausable transfers.
 **/

// BK Ok
contract PausableToken is StandardToken, Pausable {

  // BK Ok - Any account can execute, when not paused
  function transfer(address _to, uint256 _value) public whenNotPaused returns (bool) {
    // BK Ok
    return super.transfer(_to, _value);
  }

  // BK Ok - Any account can execute, when not paused
  function transferFrom(address _from, address _to, uint256 _value) public whenNotPaused returns (bool) {
    // BK Ok
    return super.transferFrom(_from, _to, _value);
  }

  // BK Ok - Any account can execute, when not paused
  function approve(address _spender, uint256 _value) public whenNotPaused returns (bool) {
    // BK Ok
    return super.approve(_spender, _value);
  }

  // BK Ok - Any account can execute, when not paused
  function increaseApproval(address _spender, uint _addedValue) public whenNotPaused returns (bool success) {
    // BK Ok
    return super.increaseApproval(_spender, _addedValue);
  }

  // BK Ok - Any account can execute, when not paused
  function decreaseApproval(address _spender, uint _subtractedValue) public whenNotPaused returns (bool success) {
    // BK Ok
    return super.decreaseApproval(_spender, _subtractedValue);
  }
}

```
