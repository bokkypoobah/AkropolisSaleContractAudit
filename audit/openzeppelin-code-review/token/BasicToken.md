# BasicToken

Source file [../../openzeppelin-contracts/token/BasicToken.sol](../../openzeppelin-contracts/token/BasicToken.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;


// BK Next 2 Ok
import './ERC20Basic.sol';
import '../math/SafeMath.sol';


/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances.
 */
// BK Ok
contract BasicToken is ERC20Basic {
  // BK Ok
  using SafeMath for uint256;

  // BK Ok
  mapping(address => uint256) balances;

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  // BK Ok - Any account can execute, but will require sufficient tokens to transfer
  function transfer(address _to, uint256 _value) public returns (bool) {
    // BK Ok
    require(_to != address(0));
    // BK Ok
    require(_value <= balances[msg.sender]);

    // SafeMath.sub will throw if there is not enough balance.
    // BK Ok
    balances[msg.sender] = balances[msg.sender].sub(_value);
    // BK Ok
    balances[_to] = balances[_to].add(_value);
    // BK Ok - Log event
    Transfer(msg.sender, _to, _value);
    // BK Ok
    return true;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  // BK Ok - View function
  function balanceOf(address _owner) public view returns (uint256 balance) {
    // BK Ok
    return balances[_owner];
  }

}

```
