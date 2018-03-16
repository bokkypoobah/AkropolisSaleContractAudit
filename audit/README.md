## Recommendation

* **LOW IMPORTANCE** In *SaleConfiguration*, `AET_RATE`, `HARD_CAP`, `TOTAL_SUPPLY` and `PUBLIC_SALE_SUPPLY` should be made *constant*
* **LOW IMPORTANCE** In *SaleConfiguration*, `TOTAL_SUPPLY` to `DEVELOPMENT_FUND_VALUE` are tokens and not *ether*. Something like
  `* DECIMALSFACTOR` where `uint256 public constant DECIMALSFACTOR = 10**uint256(decimals)` should be used instead of *ether*

## Code Review

* [ ] [code-review/Administrable.md](code-review/Administrable.md)
  * [ ] contract Administrable is Ownable
* [ ] [code-review/AkropolisCrowdsale.md](code-review/AkropolisCrowdsale.md)
  * [ ] contract AkropolisCrowdsale is CappedCrowdsale, FinalizableCrowdsale, WhitelistedCrowdsale
* [ ] [code-review/AkropolisToken.md](code-review/AkropolisToken.md)
  * [ ] contract AkropolisToken is MintableToken, PausableToken
* [ ] [code-review/AllocationsManager.md](code-review/AllocationsManager.md)
  * [ ] contract AllocationsManager is Administrable, Pausable, SaleConfiguration
  * [ ]     using SafeERC20 for AkropolisToken;
  * [ ]     using SafeMath for uint256;
* [ ] [code-review/LinearTokenVesting.md](code-review/LinearTokenVesting.md)
  * [ ] contract LinearTokenVesting is Ownable
  * [ ]     using SafeMath for uint256;
  * [ ]     using SafeERC20 for ERC20Basic;
* [ ] [code-review/Migrations.md](code-review/Migrations.md)
  * [ ] contract Migrations
* [ ] [code-review/SaleConfiguration.md](code-review/SaleConfiguration.md)
  * [ ] contract SaleConfiguration
* [ ] [code-review/Whitelist.md](code-review/Whitelist.md)
  * [ ] contract Whitelist is Administrable
  * [ ]     using SafeMath for uint256;
* [ ] [code-review/WhitelistedCrowdsale.md](code-review/WhitelistedCrowdsale.md)
  * [ ] contract WhitelistedCrowdsale is Ownable
  * [ ]     using SafeMath for uint256;

Using https://github.com/OpenZeppelin/zeppelin-solidity/tree/v1.5.0