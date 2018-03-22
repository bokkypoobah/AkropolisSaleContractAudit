# FinalizableCrowdsale

Source file [../../openzeppelin-contracts/crowdsale/FinalizableCrowdsale.sol](../../openzeppelin-contracts/crowdsale/FinalizableCrowdsale.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 3 Ok
import '../math/SafeMath.sol';
import '../ownership/Ownable.sol';
import './Crowdsale.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
// BK Ok
contract FinalizableCrowdsale is Crowdsale, Ownable {
  // BK Ok - But not required
  using SafeMath for uint256;

  // BK Ok
  bool public isFinalized = false;

  // BK Ok - Event
  event Finalized();

  /**
   * @dev Must be called after crowdsale ends, to do some extra finalization
   * work. Calls the contract's finalization function.
   */
  // BK Ok - Only owner can execute
  function finalize() onlyOwner public {
    // BK Ok
    require(!isFinalized);
    // BK Ok
    require(hasEnded());

    // BK Ok
    finalization();
    // BK Ok - Log event
    Finalized();

    // BK Ok
    isFinalized = true;
  }

  /**
   * @dev Can be overridden to add finalization logic. The overriding function
   * should call super.finalization() to ensure the chain of finalization is
   * executed entirely.
   */
  // BK Ok - Internal function
  function finalization() internal {
  }
}

```
