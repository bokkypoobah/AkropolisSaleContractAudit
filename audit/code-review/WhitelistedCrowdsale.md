# WhitelistedCrowdsale

Source file [../../contracts/WhitelistedCrowdsale.sol](../../contracts/WhitelistedCrowdsale.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 6 Ok
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './Whitelist.sol';
import "./SaleConfiguration.sol";

/**
 * @title WhitelistedCrowdsale
 * @dev Adding a support for whitelisting users during a crowdsale.
 * Whitelisted users will be divided into 3 tiers
 * Each tier has it's own min and max contribution limits
 * Tier 1: Can enter the crowdsale from round 1
 * Tier 2: Can enter the crowdsale from round 2
 * Tier 3: Can enter the crowdsale from round 3
 * Limits are awarded per user not per round
 * Min contribution limits are waived in round 3 so all of the users can spend the remaining cap
 */
// BK Ok
contract WhitelistedCrowdsale is Ownable {
    // BK Ok
    using SafeMath for uint256;

    // BK Ok
    Whitelist whitelist;
    // BK Ok
    SaleConfiguration config;

    // BK Next 2 Ok
    uint256[] public min = new uint[](4);
    uint256[] public max = new uint[](4);

    // BK Next 5 Ok
    uint256 public startTime;
    uint256 public round1EndTime;
    uint256 public round2EndTime;
    uint256 public endTime;
    uint256 public roundDuration;

    // BK Ok - Constructor
    function WhitelistedCrowdsale(uint256 _startTime, uint256 _endTime, Whitelist _whitelist, SaleConfiguration _config) public {
        // BK Next 2 Ok - These are checked in Crowdsale
        startTime = _startTime;
        endTime = _endTime;

        // BK Next 2 Ok - These are checked in AkropolisCrowdsale
        whitelist = _whitelist;
        config = _config;

        // BK Next 5 Ok
        setCapsPerTier(1, config.MIN_TIER_1(), config.MAX_TIER_1());
        setCapsPerTier(2, config.MIN_TIER_2(), config.MAX_TIER_2());
        setCapsPerTier(3, config.MIN_TIER_3(), config.MAX_TIER_3());
        setRound1EndTime(startTime.add(config.ROUND_DURATION()));
        setRound2EndTime(round1EndTime.add(config.ROUND_DURATION()));
    }

    /**
    * @dev Sets max and min contribution values per user tier
    */
    // BK Ok - Only owner can execute
    function setCapsPerTier(uint8 _tier, uint256 _min, uint256 _max) public onlyOwner {
        // BK Ok
        require(_tier >=1 && _tier <= 3);
        // BK Ok
        require(_min >= 0);
        // BK Ok
        require(_max  >= _min);

        // BK Next 2 Ok
        min[_tier] = _min;
        max[_tier] = _max;
    }

    /**
    * @dev Sets the end time of round 1
    */
    // BK Ok - Only owner can execute
    function setRound1EndTime(uint256 _round1EndTime) public onlyOwner {
        // BK Ok
        require(_round1EndTime > startTime);
        // BK Ok
        require(round2EndTime == 0 || _round1EndTime < round2EndTime);
        // BK Ok
        round1EndTime = _round1EndTime;
    }


    /**
    * @dev Sets the end time of round 2
    */
    // BK Ok - Only owner can execute
    function setRound2EndTime(uint256 _round2EndTime) public onlyOwner {
        // BK Ok
        require(_round2EndTime > round1EndTime);
        // BK Ok
        require(_round2EndTime < endTime);
        // BK Ok
        round2EndTime = _round2EndTime;
    }

    /**
    * @dev Get the number of the current round
    */
    // BK Ok - View function
    function getCurrentRound() public view returns(uint256) {
        // BK Ok
        require(now >= startTime);
        // BK Ok
        if (now >= round2EndTime) {
            // BK Ok
            return 3;
        // BK Ok
        } else if (now >= round1EndTime) {
            // BK Ok
            return 2;
        // BK Ok
        } else {
            // BK Ok
            return 1;
        }
    }

    /**
    * @dev Get the of a buyer in the current round
    */
    // BK Ok - View function
    function getCap(address _buyer) public view returns(uint256) {
        // BK Ok - Note that this is the max in the tier assigned to a buyer
        return max[whitelist.getTier(_buyer)];
    }

    /**
    * @dev Get the of a buyer in the current round
    */
    // BK Ok - View function
    function getMin(address _buyer) public view returns(uint256) {
        // BK Ok
        if (getCurrentRound() >= 3) {
            // BK Ok
            return 0;
        // BK Ok
        } else {
            // BK Ok
            return min[whitelist.getTier(_buyer)];
        }
    }

    /**
    * @dev checks if the buyer can participate in the current round
    */
    // BK Ok - View function
    function isBuyerAdmitted(address _buyer) public view returns(bool) {
        // BK Ok
        require(whitelist.isWhitelisted(_buyer));
        // BK Ok
        uint8 tier = whitelist.getTier(_buyer);
        // BK Ok
        return tier <= getCurrentRound();
    }

}
```
