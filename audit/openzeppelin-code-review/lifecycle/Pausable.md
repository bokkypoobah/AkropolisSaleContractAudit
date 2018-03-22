# Pausable

Source file [../../openzeppelin-contracts/lifecycle/Pausable.sol](../../openzeppelin-contracts/lifecycle/Pausable.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;


// BK Ok
import "../ownership/Ownable.sol";


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
// BK Ok
contract Pausable is Ownable {
  // BK Next 2 Ok - Events
  event Pause();
  event Unpause();

  // BK Ok
  bool public paused = false;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  // BK Ok - Modifier
  modifier whenNotPaused() {
    // BK Ok
    require(!paused);
    // BK Ok
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  // BK Ok - Modifier
  modifier whenPaused() {
    // BK Ok
    require(paused);
    // BK Ok
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  // BK Ok - Only owner can call when not paused
  function pause() onlyOwner whenNotPaused public {
    // BK Ok
    paused = true;
    // BK Ok - Log event
    Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  // BK Ok - Only owner can call when paused
  function unpause() onlyOwner whenPaused public {
    // BK Ok
    paused = false;
    // BK Ok - Log event
    Unpause();
  }
}

```
