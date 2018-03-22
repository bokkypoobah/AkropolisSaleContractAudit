# SafeMath

Source file [../../openzeppelin-contracts/math/SafeMath.sol](../../openzeppelin-contracts/math/SafeMath.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
// BK Ok
library SafeMath {
  // BK Ok
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // BK Ok
    if (a == 0) {
      // BK Ok
      return 0;
    }
    // BK Ok
    uint256 c = a * b;
    // BK Ok
    assert(c / a == b);
    // BK Ok
    return c;
  }

  // BK Ok
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    // BK Ok
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    // BK Ok
    return c;
  }

  // BK Ok
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    // BK Ok
    assert(b <= a);
    // BK Ok
    return a - b;
  }

  // BK Ok
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    // BK Ok
    uint256 c = a + b;
    // BK Ok
    assert(c >= a);
    // BK Ok
    return c;
  }
}

```
