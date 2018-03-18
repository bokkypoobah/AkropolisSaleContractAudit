# AkropolisToken

Source file [../../contracts/AkropolisToken.sol](../../contracts/AkropolisToken.sol).

<br />

<hr />

```javascript
/*
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*/

// BK Ok
pragma solidity ^0.4.18;

// BK Next 2 Ok
import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/token/PausableToken.sol";


// BK Ok
contract AkropolisToken is MintableToken, PausableToken {

    // BK NOTE - Next 4 variables can be marked `constant`
    // BK Ok
    string public name = "Akropolis External Token";

    // BK Ok
    uint8 public decimals = 18;

    // BK Ok
    string public symbol = "AET";

    // BK Ok
    string public version = "AET 1.0";
}
```
