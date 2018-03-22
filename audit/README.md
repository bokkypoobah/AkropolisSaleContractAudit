# Akropolis Crowdsale Contract Audit

**Status: Work in progress**

## Summary

[Akropolis](http://akropolis.io/) intends to run a crowdsale in Q1/Q2 2018.

Bok Consulting Pty Ltd was commissioned to perform an audit on the Ethereum crowdsale smart contracts for Akropolis.

This audit has been conducted on Akropolis' source code in commits
[7a929f9](https://github.com/akropolisio/akropolis-sale/commit/7a929f9124be8010f8561be7483332c5344beb1a) and
[ef14193](https://github.com/akropolisio/akropolis-sale/commit/ef14193b258cd8ecd11b3836f318ca3b58dcf57f).

**TODO** - Check that no potential vulnerabilities have been identified in the crowdsale and token contracts.

<br />

<hr />

## Table Of Contents

* [Summary](#summary)
* [Recommendations](#recommendations)
* [Potential Vulnerabilities](#potential-vulnerabilities)
* [Scope](#scope)
* [Limitations](#limitations)
* [Due Diligence](#due-diligence)
* [Risks](#risks)
* [Testing](#testing)
* [Code Review](#code-review)

<br />

<hr />

## Recommendations

### Outstanding
* **LOW IMPORTANCE** In *AkropolisToken*, `name`, `decimals`, `symbol` and `version` should all be marked *constant*
* **LOW IMPORTANCE** In *AllocationsManager*, modifiers and functions from `Pausable` that is inherited are not used
* **LOW IMPORTANCE** In *SaleConfiguration*, compiler warnings like `Warning: Initial value for constant variable has to be compile-time constant. This will fail to compile with the next breaking version change.`. `uint256 public constant MAX_ALLOCATION_VALUE = DECIMALS_FACTOR.mul(1000);` can be rewritten as `uint256 public constant MAX_ALLOCATION_VALUE = 1000 * DECIMALS_FACTOR;` as we know both
values being multiplied
* **LOW IMPORTANCE** In *SaleConfiguration*, consider using `uint8 public constant DECIMALS = 18;` and `uint256 public constant DECIMALS_FACTOR = 10**uint256(DECIMALS);` as the constant 18 is named as DECIMALS, for clarity
* **LOW IMPORTANCE** In *WhitelistedCrowdsale*, consider making `uint256[] min = new uint[](4);` and `uint256[] max = new uint[](4);` *public* as this assists in validations and troubleshooting

<br />

### Completed

* **HIGH IMPORTANCE** In *AllocationsManager*, anyone can execute `removeAllocation(...)` to remove someone else's allocations
  * [x] Fixed in [ef14193](https://github.com/akropolisio/akropolis-sale/commit/ef14193b258cd8ecd11b3836f318ca3b58dcf57f)
* **LOW IMPORTANCE** In *LinearTokenVesting*, simplify the user's process of unlocking vested tokens by storing a reference to
  the token contract address
  * [x] Updated in [ef14193](https://github.com/akropolisio/akropolis-sale/commit/ef14193b258cd8ecd11b3836f318ca3b58dcf57f)
* **LOW IMPORTANCE** In *SaleConfiguration*, `AET_RATE`, `HARD_CAP`, `TOTAL_SUPPLY` and `PUBLIC_SALE_SUPPLY` should be made *constant*
  * [x] Updated in [ef14193](https://github.com/akropolisio/akropolis-sale/commit/ef14193b258cd8ecd11b3836f318ca3b58dcf57f)
* **LOW IMPORTANCE** In *SaleConfiguration*, `TOTAL_SUPPLY` to `DEVELOPMENT_FUND_VALUE` are tokens and not *ether*. Use something
  like `* DECIMALSFACTOR` where `uint256 public constant DECIMALSFACTOR = 10**uint256(decimals)` instead of *ether*, for clarity
  * [x] Updated in [ef14193](https://github.com/akropolisio/akropolis-sale/commit/ef14193b258cd8ecd11b3836f318ca3b58dcf57f)
* **LOW IMPORTANCE** In *WhitelistedCrowdsale*, *Crowdsale.sol* is imported twice
  * [x] Removed in [ef14193](https://github.com/akropolisio/akropolis-sale/commit/ef14193b258cd8ecd11b3836f318ca3b58dcf57f)
* **LOW IMPORTANCE** In *WhitelistedCrowdsale*, the comment "Tier 3: Can enter the crowdsale from round 3, there are no limits
  for this tier" is inaccurate. *SaleConfiguration* has a `MAX_TIER_3 = 3 ether`, and this is checked in *AkropolisCrowdsale*
  `bool isBelowCap = msg.value <= getAvailableCap(msg.sender)`
  * [x] Updated in [ef14193](https://github.com/akropolisio/akropolis-sale/commit/ef14193b258cd8ecd11b3836f318ca3b58dcf57f)
* **LOW IMPORTANCE** In *SaleConfiguration*, there is a `HARD_CAP = 6000 ether;`. Each contributing ETH generates 10,000 tokens as specified in `AET_RATE = 10000;`. For the maximum ETH contribution of 6,000 ETH, 60,000,000 tokens will be generated. There are 90,000,000 tokens that have been allocated to the crowdsale according to `PUBLIC_SALE_SUPPLY = DECIMALS_FACTOR.mul(90000000);`. The `AET_RATE`, `HARD_CAP` and `PUBLIC_SALE_SUPPLY` variables are not consistent. Is this because these rates will be updated just prior to the token sale contract deployment?
  * [x] Akropolis responded that the rate is a placeholder and will be updated just prior to the token sale contract deployment
* **LOW IMPORTANCE** In *AllocationsManager*, consider making `mapping(address => Allocation) allocations;` *public* as this assists in validations and troubleshooting
  * [x] Akropolis responded that there are alternate functions to access the data and won't be setting this data structure to *public*

<br />

<hr />

## Potential Vulnerabilities

**TODO** - Check no potential vulnerabilities have been identified in the crowdsale and token contracts.

<br />

<hr />

## Scope

This audit is into the technical aspects of the crowdsale contracts. The primary aim of this audit is to ensure that funds
contributed to these contracts are not easily attacked or stolen by third parties. The secondary aim of this audit is to
ensure the coded algorithms work as expected. This audit does not guarantee that that the code is bugfree, but intends to
highlight any areas of weaknesses.

<br />

<hr />

## Limitations

This audit makes no statements or warranties about the viability of the Akropolis' business proposition, the individuals
involved in this business or the regulatory regime for the business model.

<br />

<hr />

## Due Diligence

As always, potential participants in any crowdsale are encouraged to perform their due diligence on the business proposition
before funding any crowdsales.

Potential participants are also encouraged to only send their funds to the official crowdsale Ethereum address, published on
the crowdsale beneficiary's official communication channel.

Scammers have been publishing phishing address in the forums, twitter and other communication channels, and some go as far as
duplicating crowdsale websites. Potential participants should NOT just click on any links received through these messages.
Scammers have also hacked the crowdsale website to replace the crowdsale contract address with their scam address.
 
Potential participants should also confirm that the verified source code on EtherScan.io for the published crowdsale address
matches the audited source code, and that the deployment parameters are correctly set, including the constant parameters.

<br />

<hr />

## Risks

**TODO**

<br />

<hr />

## Testing

Details of the testing environment can be found in [test](test).

The following functions were tested using the script [test/01_test1.sh](test/01_test1.sh) with the summary results saved
in [test/test1results.txt](test/test1results.txt) and the detailed output saved in [test/test1output.txt](test/test1output.txt):

* [x] Deploy allocation contracts
* [x] Deploy whitelist contract
  * [x] Set whitelist admin
  * [x] Whitelist addresses
* [x] Deploy configuration contract
* [x] Deploy crowdsale contract
* [x] Send contributions in rounds 1, 2 and 3
* [x] Set up allocations contract
  * [x] Set admin and token contract address
  * [x] Register allocations
* [x] Finalise the crowdsale contract
* [x] Distribute vesting allocations
* [x] `transfer(...)`, `approve(...)` and `transferFrom(...)` tokens
* [x] Claim vested tokens through time

<br />

<hr />

## Code Review

* [x] [code-review/Administrable.md](code-review/Administrable.md)
  * [x] contract Administrable is Ownable
* [x] [code-review/AkropolisToken.md](code-review/AkropolisToken.md)
  * [x] contract AkropolisToken is MintableToken, PausableToken
  * [ ] See **NOTE** in document
* [x] [code-review/AllocationsManager.md](code-review/AllocationsManager.md)
  * [x] contract AllocationsManager is Administrable, Pausable, SaleConfiguration
    * [x] using SafeERC20 for AkropolisToken
    * [x] using SafeMath for uint256
* [x] [code-review/LinearTokenVesting.md](code-review/LinearTokenVesting.md)
  * [x] contract LinearTokenVesting is Ownable
    * [x] using SafeMath for uint256
    * [x] using SafeERC20 for ERC20Basic
* [x] [code-review/SaleConfiguration.md](code-review/SaleConfiguration.md)
  * [x] contract SaleConfiguration
  * [ ] See **NOTE** in document
* [x] [code-review/Whitelist.md](code-review/Whitelist.md)
  * [x] contract Whitelist is Administrable
    * [x] using SafeMath for uint256
* [ ] [code-review/WhitelistedCrowdsale.md](code-review/WhitelistedCrowdsale.md)
  * [ ] contract WhitelistedCrowdsale is Ownable
    * [ ] using SafeMath for uint256
* [ ] [code-review/AkropolisCrowdsale.md](code-review/AkropolisCrowdsale.md)
  * [ ] contract AkropolisCrowdsale is CappedCrowdsale, FinalizableCrowdsale, WhitelistedCrowdsale

<br />

### Excluded Files

Excluded from this review as the following contract is used for testing:

* [../contracts/Migrations.sol](../contracts/Migrations.sol)

<br />

### OpenZeppelin Include Files

From https://github.com/OpenZeppelin/zeppelin-solidity/tree/v1.5.0, as advised by Akropolis

#### Maths

* [x] [code-review/SafeMath.md](code-review/SafeMath.md)
  * [x] library SafeMath

#### Ownership

* [x] [code-review/Ownable.md](code-review/Ownable.md)
  * [x] contract Ownable

#### Lifecycle

* [x] [code-review/Pausable.md](code-review/Pausable.md)
  * [x] contract Pausable is Ownable

#### Token

* [x] [code-review/ERC20Basic.md](code-review/ERC20Basic.md)
  * [x] contract ERC20Basic
* [x] [code-review/ERC20.md](code-review/ERC20.md)
  * [x] contract ERC20 is ERC20Basic
* [x] [code-review/BasicToken.md](code-review/BasicToken.md)
  * [x] contract BasicToken is ERC20Basic
    * [x] using SafeMath for uint256;
* [x] [code-review/StandardToken.md](code-review/StandardToken.md)
  * [x] contract StandardToken is ERC20, BasicToken
* [x] [code-review/PausableToken.md](code-review/PausableToken.md)
  * [x] contract PausableToken is StandardToken, Pausable
* [x] [code-review/MintableToken.md](code-review/MintableToken.md)
  * [x] contract MintableToken is StandardToken, Ownable

#### Crowdsale

* [x] [code-review/Crowdsale.md](code-review/Crowdsale.md)
  * [x] contract Crowdsale
    * [x] using SafeMath for uint256;
* [x] [code-review/FinalizableCrowdsale.md](code-review/FinalizableCrowdsale.md)
  * [x] contract FinalizableCrowdsale is Crowdsale, Ownable
    * [x] using SafeMath for uint256;
* [x] [code-review/CappedCrowdsale.md](code-review/CappedCrowdsale.md)
  * [x] contract CappedCrowdsale is Crowdsale
    * [x] using SafeMath for uint256;

<br />

<br />

(c) BokkyPooBah / Bok Consulting Pty Ltd for Akropolis - Mar 19 2018. The MIT Licence.