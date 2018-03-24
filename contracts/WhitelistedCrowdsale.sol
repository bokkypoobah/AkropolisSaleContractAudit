pragma solidity ^0.4.18;

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
contract WhitelistedCrowdsale is Ownable {
    using SafeMath for uint256;

    Whitelist whitelist;
    SaleConfiguration config;

    uint256[] public min = new uint[](4);
    uint256[] public max = new uint[](4);

    uint256 public startTime;
    uint256 public round1EndTime;
    uint256 public round2EndTime;
    uint256 public endTime;
    uint256 public roundDuration;

    function WhitelistedCrowdsale(uint256 _startTime, uint256 _endTime, Whitelist _whitelist, SaleConfiguration _config) public {
        startTime = _startTime;
        endTime = _endTime;

        whitelist = _whitelist;
        config = _config;

        setCapsPerTier(1, config.MIN_TIER_1(), config.MAX_TIER_1());
        setCapsPerTier(2, config.MIN_TIER_2(), config.MAX_TIER_2());
        setCapsPerTier(3, config.MIN_TIER_3(), config.MAX_TIER_3());
        setRound1EndTime(startTime.add(config.ROUND_DURATION()));
        setRound2EndTime(round1EndTime.add(config.ROUND_DURATION()));
    }

    /**
    * @dev Sets max and min contribution values per user tier
    */
    function setCapsPerTier(uint8 _tier, uint256 _min, uint256 _max) public onlyOwner {
        require(_tier >=1 && _tier <= 3);
        require(_min >= 0);
        require(_max  >= _min);

        min[_tier] = _min;
        max[_tier] = _max;
    }

    /**
    * @dev Sets the end time of round 1
    */
    function setRound1EndTime(uint256 _round1EndTime) public onlyOwner {
        require(_round1EndTime > startTime);
        require(round2EndTime == 0 || _round1EndTime < round2EndTime);
        round1EndTime = _round1EndTime;
    }


    /**
    * @dev Sets the end time of round 2
    */
    function setRound2EndTime(uint256 _round2EndTime) public onlyOwner {
        require(_round2EndTime > round1EndTime);
        require(_round2EndTime < endTime);
        round2EndTime = _round2EndTime;
    }

    /**
    * @dev Get the number of the current round
    */
    function getCurrentRound() public view returns(uint256) {
        require(now >= startTime);
        if (now >= round2EndTime) {
            return 3;
        } else if (now >= round1EndTime) {
            return 2;
        } else {
            return 1;
        }
    }

    /**
    * @dev Get the of a buyer in the current round
    */
    function getCap(address _buyer) public view returns(uint256) {
        return max[whitelist.getTier(_buyer)];
    }

    /**
    * @dev Get the of a buyer in the current round
    */
    function getMin(address _buyer) public view returns(uint256) {
        if (getCurrentRound() >= 3) {
            return 0;
        } else {
            return min[whitelist.getTier(_buyer)];
        }
    }

    /**
    * @dev checks if the buyer can participate in the current round
    */
    function isBuyerAdmitted(address _buyer) public view returns(bool) {
        require(whitelist.isWhitelisted(_buyer));
        uint8 tier = whitelist.getTier(_buyer);
        return tier <= getCurrentRound();
    }

}