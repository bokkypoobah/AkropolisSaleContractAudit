# Administrable

Source file [../../contracts/Administrable.sol](../../contracts/Administrable.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK NOTE - 6 lines below can be replaced by `import "zeppelin-solidity/contracts/ownership/Ownable.sol";`
import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "./AkropolisToken.sol";
import "./LinearTokenVesting.sol";

/**
 * @title Administrable
 * @dev Contract defines a role of an administrator with lesser privileges than the owner.
 * The administrator may perform oranizational task without having a decisive power over
 * token or funds transfer.
 */
// BK Ok
contract Administrable is Ownable {

    // BK Ok - Event
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    //An address serving as an admin
    // BK Ok
    address public admin;

    /**
    * @dev Throws if called by any account other than the admin.
    */
    // BK Ok - Modifier
    modifier onlyAdmin() {
        // BK Ok
        require(msg.sender == admin);
        // BK Ok
        _;
    }

    /**
    * @dev Owner is allowed to replace the admin at any given time
    */
    // BK Ok - Only owner can execute
    function setAdmin(address _admin) public onlyOwner {
        // BK NOTE - Better to use `require(_admin != address(0));`
        require(address(_admin) != 0x0);
        // BK Ok - Log event
        AdminChanged(admin, _admin);
        // BK Ok
        admin = _admin;
    }

}
```
