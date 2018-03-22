# CappedCrowdsale

Source file [../../openzeppelin-contracts/crowdsale/CappedCrowdsale.sol](../../openzeppelin-contracts/crowdsale/CappedCrowdsale.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 2 Ok
import '../math/SafeMath.sol';
import './Crowdsale.sol';

/**
 * @title CappedCrowdsale
 * @dev Extension of Crowdsale with a max amount of funds raised
 */
// BK Ok
contract CappedCrowdsale is Crowdsale {
  // BK Ok
  using SafeMath for uint256;

  // BK Ok
  uint256 public cap;

  // BK Ok - Constructor
  function CappedCrowdsale(uint256 _cap) public {
    // BK Ok
    require(_cap > 0);
    // BK Ok
    cap = _cap;
  }

  // overriding Crowdsale#validPurchase to add extra cap logic
  // @return true if investors can buy at the moment
  // BK Ok - View function
  function validPurchase() internal view returns (bool) {
    // BK Ok
    bool withinCap = weiRaised.add(msg.value) <= cap;
    // BK Ok
    return super.validPurchase() && withinCap;
  }

  // overriding Crowdsale#hasEnded to add cap logic
  // @return true if crowdsale event has ended
  // BK Ok - View function
  function hasEnded() public view returns (bool) {
    // BK Ok
    bool capReached = weiRaised >= cap;
    // BK Ok
    return super.hasEnded() || capReached;
  }

}

```
