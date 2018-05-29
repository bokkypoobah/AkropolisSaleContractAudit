# LinearTokenVesting

Source file [../../contracts/LinearTokenVesting.sol](../../contracts/LinearTokenVesting.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 4 Ok
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./AkropolisToken.sol";

/**
 * @title LinearTokenVesting
 * @dev A token holder contract that can release its tokens pro-rata with the passing time
 * starting after the cliff period
 */
// BK Ok
contract LinearTokenVesting is Ownable {
    // BK Next 2 Ok
    using SafeMath for uint256;
    using SafeERC20 for AkropolisToken;

    // BK Ok - Event
    event Released(uint256 amount);

    // AKT token that is under vesting
    // BK Ok
    AkropolisToken public token;

    // beneficiary of tokens after they are released
    // BK Ok
    address public beneficiary;

    // start of the vesting period
    // BK Ok
    uint256 public start;

    // duration of the vesting period
    // BK Ok
    uint256 public duration;

    // time after which tokens begin to vest
    // BK Ok
    uint256 public cliff;

    // amounts of the AKT token that has been already released
    // BK Ok
    uint256 public released;

    /**
     * @dev Creates a vesting contract that vests its balance of the AKT token to the
     * _beneficiary, gradually in a linear fashion until _start + _duration.
     * @param _token address of the AKT token that is under vesting
     * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param _cliff duration in seconds after which tokens will begin to vest
     * @param _duration duration in seconds of the period in which the tokens will vest
     */
    // BK Ok - Constructor, called by AllocationsManager
    function LinearTokenVesting(AkropolisToken _token, address _beneficiary, uint256 _cliff, uint256 _duration) public {
        // BK Ok
        require(address(_token) != 0x0);
        // BK Ok
        require(_beneficiary != 0x0);
        // BK Ok
        require(_duration > 0);
        // BK Ok
        require(_cliff <= _duration);

        // BK Next 5 Ok
        token = _token;
        beneficiary = _beneficiary;
        duration = _duration;
        start = now;
        cliff = _cliff;
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     */
    // BK Ok - Only beneficiary or crowdsale owner can execute this function
    function release() public {
        // BK Ok
        require(msg.sender == owner || msg.sender == beneficiary);

        // BK Ok
        uint256 unreleased = releasableAmount();
        // BK Ok
        require(unreleased > 0);

        // BK Ok
        released = released.add(unreleased);
        // BK Ok
        token.safeTransfer(beneficiary, unreleased);
        // BK Ok - Log event
        Released(unreleased);
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     */
    // BK Ok - View function
    function releasableAmount() public view returns (uint256) {
        // BK Ok
        return vestedAmount().sub(released);
    }

    /**
     * @dev Calculates the amount that has already vested.
     */
    // BK Ok - View function
    function vestedAmount() public view returns (uint256) {
        // BK Ok
        uint256 currentBalance = token.balanceOf(this);
        // BK Ok
        uint256 totalBalance = currentBalance.add(released);

        // BK Ok
        if (now < start.add(cliff)) {
            // BK Ok
            return 0;
        // BK Ok
        } else if (now >= start.add(duration)) {
            // BK Ok
            return totalBalance;
        // BK Ok
        } else {
            // BK Ok
            return totalBalance.mul(now.sub(start)).div(duration);
        }
    }
}
```
