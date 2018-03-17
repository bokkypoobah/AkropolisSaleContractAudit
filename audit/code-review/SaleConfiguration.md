# SaleConfiguration

Source file [../../contracts/SaleConfiguration.sol](../../contracts/SaleConfiguration.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

/**
 * @title SaleConfiguration
 * @dev Set of parameters configuring the sale process
 */
// BK Ok
contract SaleConfiguration {

    //TODO: Update and verify values before going live

    // BK Next 2 NOTE - Can be made constant
    uint256 public AET_RATE = 10000;
    uint256 public HARD_CAP = 6000 ether;
    // BK Ok
    uint256 public constant MAX_ALLOCATION_VALUE = 1000 ether;

    // BK Next 2 NOTE - Can be made constant
    // BK Next 7 NOTE - Should ideally not use 'ether' but something like `* DECIMALSFACTOR`, where `uint256 public constant DECIMALSFACTOR = 10**uint256(decimals)`
    uint256 public TOTAL_SUPPLY = 900000000 ether;
    uint256 public PUBLIC_SALE_SUPPLY = 90000000 ether;
    uint256 public constant PRESALE_SUPPLY = 180000000 ether;
    uint256 public constant TEAM_SUPPLY = 180000000 ether;
    uint256 public constant ADVISORS_SUPPLY = 49500000 ether;

    uint256 public constant RESERVE_FUND_VALUE = 180000000 ether;
    uint256 public constant DEVELOPMENT_FUND_VALUE = 220500000 ether;

    // BK Next 7 Ok
    uint256 public constant MIN_TIER_1 = 2 ether;
    uint256 public constant MAX_TIER_1 = 10 ether;
    uint256 public constant MIN_TIER_2 = 1 ether;
    uint256 public constant MAX_TIER_2 = 5 ether;
    uint256 public constant MIN_TIER_3 = 0 ether;
    uint256 public constant MAX_TIER_3 = 3 ether;
    uint256 public constant ROUND_DURATION = 3 days;

}
```
