# AllocationsManager

Source file [../../contracts/AllocationsManager.sol](../../contracts/AllocationsManager.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 8 Ok
import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import './Administrable.sol';
import "./AkropolisToken.sol";
import "./LinearTokenVesting.sol";
import "./SaleConfiguration.sol";


// BK Ok
contract AllocationsManager is Administrable, SaleConfiguration {
    // BK Next 2 Ok
    using SafeERC20 for AkropolisToken;
    using SafeMath for uint256;


    // BK Ok - Events
    event AllocationRegistered(address indexed investor, uint256 value, uint256 vestingValue, uint256 cliff, uint256 vestingPeriod);
    event AllocationDistributed(address indexed investor, uint256 value, uint256 vestingValue, uint256 cliff, uint256 vestingPeriod);
    event TokensReclaimed(address indexed newTokenOwner, uint256 valueReclaimed);

    // BK Ok - Enum
    enum AllocationStatus {REGISTERED, DISTRIBUTED}

    // BK Next block Ok
    struct Allocation {
        uint256 index;
        uint256 value;
        uint256 vestingValue;
        uint256 cliff;
        uint256 vestingPeriod;
        address vestingContract;
        AllocationStatus status;
    }

    // Akropolis Token which is distributed during the pre-sale
    // BK Ok
    AkropolisToken public token;

    //Map representing how many tokens have been allocated for an investor address
    // BK Ok
    mapping(address => Allocation) allocations;

    //Array of addresses stored in addition order
    // BK Ok
    address[] public indexedAllocations;

    //Total value of all allocations (including of the vesting)
    // BK Ok
    uint256 public totalAllocated;

    /**
    * @dev Sets the token that going to be distributed based on allocations
    */
    // BK Ok - Only owner can execute
    function setToken(AkropolisToken _token) public onlyOwner {
        // BK Ok
        require(address(_token) != 0x0);
        // BK Ok
        token = _token;
    }


    /**
    * @dev Register the amount of tokens allocated for an investor.
    * The amount my be changed before the tokens are distributed.
    */
    // BK Ok - Only admin can execute
    function registerAllocation(address _investor, uint256 _value, uint256 _vestingValue, uint256 _cliff, uint256 _vestingPeriod) public onlyAdmin {
        // BK Ok
        require(_investor != 0x0);
        // BK Ok
        require(_value > 0 || _vestingValue > 0);
        // BK Ok
        require(_cliff <= _vestingPeriod);
        // BK Ok
        require(MAX_ALLOCATION_VALUE > 0);
        // BK Ok
        require(_value <= MAX_ALLOCATION_VALUE);
        // BK Ok
        require( (_vestingValue == 0 && _vestingPeriod == 0) || (_vestingValue > 0 && _vestingPeriod > 0) );

        // BK Ok
        require(allocations[_investor].status != AllocationStatus.DISTRIBUTED);

        // BK Ok - First entry has index 0
        uint256 index = indexedAllocations.length;
        // BK Ok
        if (allocations[_investor].value > 0) { //Update mode
            // BK Ok
            totalAllocated = totalAllocated.sub(allocations[_investor].value);
            // BK Ok
            totalAllocated = totalAllocated.sub(allocations[_investor].vestingValue);
            // BK Ok
            index = allocations[_investor].index;
        // BK Ok
        } else { //Insert mode
            // BK Ok
            indexedAllocations.push(_investor);
        }

        // BK Ok
        allocations[_investor] = Allocation(index, _value, _vestingValue, _cliff, _vestingPeriod, 0, AllocationStatus.REGISTERED);

        // BK Ok
        totalAllocated = totalAllocated.add(_value).add(_vestingValue);

        // BK Ok - Log event
        AllocationRegistered(_investor, _value, _vestingValue, _cliff, _vestingPeriod);
    }

    /**
    * @dev Mints the allocated tokens and transfer them to the investor account.
    */
    // BK Ok - Only owner can execute
    function distributeAllocation(address _investor) public onlyOwner {
        // BK Ok
        Allocation storage allocation = allocations[_investor];
        // BK Ok
        require(allocation.value > 0);
        // BK Ok
        require(allocation.status == AllocationStatus.REGISTERED);

        // BK Ok - Unvested value
        token.safeTransfer(_investor, allocation.value);
        // BK Ok - Vested value
        if (allocation.vestingValue > 0) {
            // BK Ok
            LinearTokenVesting vesting = new LinearTokenVesting(token, _investor, allocation.cliff, allocation.vestingPeriod);
            // BK Ok
            vesting.transferOwnership(owner);
            // BK Ok
            token.safeTransfer(address(vesting), allocation.vestingValue);
            // BK Ok
            allocation.vestingContract = address(vesting);
        }
        // BK Ok
        allocation.status = AllocationStatus.DISTRIBUTED;

        // BK Ok - Log event
        AllocationDistributed(_investor, allocation.value, allocation.vestingValue, allocation.cliff, allocation.vestingPeriod);
    }

    /**
    * @dev Releases the tokens that were allocated for distribution
    * This is an emergency procedure to avoid freezing tokens if
    * they cannot be successfully distributed
    */
    // BK Ok - Only owner can execute
    function reclaimTokens(address _newTokenOwner) public onlyOwner {
        // BK Ok
        uint256 total = token.balanceOf(this);
        // BK Ok
        token.transfer(_newTokenOwner, total);
        // BK Ok - Log event
        TokensReclaimed(_newTokenOwner, total);
    }

    /**
    * @dev Returns the value of allocated tokens in the following format
    * [allocated tokens, allocated vesting, cliff, vesting period]
    */
    // BK Ok - View function
    function getAllocation(address _investor) public view returns(uint256[4]) {
        // BK Ok
        if (allocations[_investor].status == AllocationStatus.REGISTERED) {
            // BK Ok
            return [
                allocations[_investor].value,
                allocations[_investor].vestingValue,
                allocations[_investor].cliff,
                allocations[_investor].vestingPeriod
            ];
        }
    }

    /**
    * @dev Returns the address of a vesting contract for a given investor
    */
    // BK Ok - View function
    function getVesting(address _investor) public view returns(address) {
        // BK Ok
        if (allocations[_investor].status == AllocationStatus.DISTRIBUTED) {
            // BK Ok
            return allocations[_investor].vestingContract;
        }
    }

    /**
    * @dev Returns the number of allocations registered
    */
    // BK Ok - View function
    function getAllocationsCount() public view returns(uint256) {
        // BK Ok
        return indexedAllocations.length;
    }

    /**
    * @dev Returns the address of the allocation at the given index
    */
    // BK Ok - View function
    function getAllocationAddress(uint256 _index) public view returns(address) {
        // BK Ok
        return indexedAllocations[_index];
    }

    /**
    * @dev Removes an allocation for a given address
    */
    function removeAllocation(address _investor) public onlyAdmin returns(bool) {
        // BK Ok
        require(allocations[_investor].value > 0);

        // BK Ok
        uint256 removalIndex = allocations[_investor].index;
        // BK Ok
        address lastAddress = indexedAllocations[indexedAllocations.length.sub(1)];
        // BK Ok
        indexedAllocations[removalIndex] = lastAddress;
        // BK Ok
        indexedAllocations.length = indexedAllocations.length.sub(1);
        // BK Ok
        allocations[lastAddress].index = removalIndex;

        // BK Ok
        totalAllocated = totalAllocated.sub(allocations[_investor].value);
        // BK Ok
        totalAllocated = totalAllocated.sub(allocations[_investor].vestingValue);
        // BK Ok
        delete allocations[_investor];
        // BK Ok
        return true;
    }

}


```
