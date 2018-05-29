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

    // BK Ok
    string public constant name = "Akropolis External Token";

    // BK Ok
    uint8 public constant decimals = 18;

    // BK Ok
    string public constant symbol = "AKT";

    // BK Ok
    string public constant version = "AKT 1.0";
}
```
