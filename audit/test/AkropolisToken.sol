/*
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.4.18;

import "token/MintableToken.sol";
import "token/PausableToken.sol";


contract AkropolisToken is MintableToken, PausableToken {

    string public name = "Akropolis External Token";

    uint8 public decimals = 18;

    string public symbol = "AET";

    string public version = "AET 1.0";
}