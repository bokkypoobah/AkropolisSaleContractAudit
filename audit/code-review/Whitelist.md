# Whitelist

Source file [../../contracts/Whitelist.sol](../../contracts/Whitelist.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 2 Ok
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './Administrable.sol';

/**
 * @title Whitelist
 * @dev Contract that allows adding users represented by ethereum accounts to a white list
 * Only whitelisted users are allowed to participate during the crowdsale
 * Users are divided into different tier on the merit of their engagement into the project
 * Specific rules for tiered users participation are specified into WhitelistedCrowdsale contract
 */
// BK Ok
contract Whitelist is Administrable {
    // BK Ok
    using SafeMath for uint256;

    //Mapping with buyer address as a key and buyer index (in order of addition) as a value
    // BK Ok
    mapping (address => uint256) public whitelist;

    //Mapping with buyer address as a key and associated tier as a value
    // BK Ok
    mapping (address => uint8) public tiers;

    //Array of addresses stored in addition order
    // BK Ok
    address[] public indexedWhitelist;

    // BK Ok - Only admin can execute
    function addToWhitelist(address _buyer, uint8 _tier) public onlyAdmin {
        // BK Ok
        require(_buyer != 0x0);
        // BK Ok
        require(_tier >= 1 && _tier <= 3);
        // BK Ok
        require(isWhitelisted(_buyer) == false);

        // BK Ok - First element has index 0
        indexedWhitelist.push(_buyer);
        // BK Ok - First element has index 1
        whitelist[_buyer] = indexedWhitelist.length;
        // BK Ok
        tiers[_buyer] = _tier;
    }

    /**
    * @dev Removes a buyer with a given address from whitelisted users
    */
    // BK Ok - Only admin can execute
    function removeFromWhitelist(address _buyer) public onlyAdmin {
        // BK Ok
        require(_buyer != 0x0);
        // BK Ok
        require(isWhitelisted(_buyer));

        // BK Ok - First element has index 0
        uint256 removalIndex = whitelist[_buyer].sub(1);
        // BK Ok
        address lastAddress = indexedWhitelist[indexedWhitelist.length.sub(1)];
        // BK Ok
        indexedWhitelist[removalIndex] = lastAddress;
        // BK Ok
        indexedWhitelist.length = indexedWhitelist.length.sub(1);

        // BK Ok
        if (removalIndex < indexedWhitelist.length) {
          // BK NOTE - 2 space indentation
          // BK Ok
          whitelist[lastAddress] = removalIndex.add(1);
        }

        // BK Ok
        delete whitelist[_buyer];
        // BK Ok
        delete tiers[_buyer];
    }


    /**
    * @return true if buyer is whitelisted
    */
    // BK Ok - View function
    function isWhitelisted(address _buyer) public view returns (bool) {
        // BK Ok
        return whitelist[_buyer] > 0;
    }


    /**
     * @notice Returns the tier associated with a given buyer
     * @param _buyer address
     */
    // BK Ok - View function. Note that a `uint8` is returned
    function getTier(address _buyer) public view returns (uint8) {
        // BK Ok
        require(isWhitelisted(_buyer));
        // BK Ok
        return tiers[_buyer];
    }


    /**
    * @return total number of whitelisted users
    */
    // BK Ok - View function
    function getWhitelistedCount() public view returns(uint256) {
        // BK Ok
        return indexedWhitelist.length;
    }


    /**
    * A helper method that may be used to list all of the whitelisted addresses
    * @return address of whitelisted user with a given index
    */
    // BK Ok - View function
    function getWhitelistedAddress(uint256 _index) public view returns(address) {
        // BK Ok
        return indexedWhitelist[_index];
    }
}

```
