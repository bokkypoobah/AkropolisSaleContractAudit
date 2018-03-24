# AkropolisCrowdsale

Source file [../../contracts/AkropolisCrowdsale.sol](../../contracts/AkropolisCrowdsale.sol).

<br />

<hr />

```javascript
// BK Ok
pragma solidity ^0.4.18;

// BK Next 8 Ok
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "./AkropolisToken.sol";
import "./WhitelistedCrowdsale.sol";
import "./Whitelist.sol";
import "./SaleConfiguration.sol";
import "./AllocationsManager.sol";


// BK Ok
contract AkropolisCrowdsale is CappedCrowdsale, FinalizableCrowdsale, WhitelistedCrowdsale {

    // BK Ok - Event
    event WalletChange(address wallet);

    // BK Ok
    mapping(address => uint256) public contributions;
    // BK Ok
    uint256 public tokensSold;

    // BK Next 3 Ok
    AllocationsManager public presaleAllocations;
    AllocationsManager public teamAllocations;
    AllocationsManager public advisorsAllocations;

    // BK Next 2 Ok
    address public reserveFund;
    address public developmentFund;


    // BK Ok
    SaleConfiguration public config;

    // BK Ok - Constructor
    function AkropolisCrowdsale(
    uint256 _startTime,
    uint256 _endTime,
    address _wallet,
    Whitelist _whitelist,
    SaleConfiguration _config
    ) public
        Crowdsale(_startTime, _endTime, _config.AET_RATE(), _wallet)
        CappedCrowdsale(_config.HARD_CAP())
        FinalizableCrowdsale()
        WhitelistedCrowdsale(_startTime, _endTime, _whitelist, _config)
    {
        // BK Next 3 Ok
        require(address(_config) != 0x0);
        require(address(_whitelist) != 0x0);
        require(_wallet != 0x0);

        //Validate configuration
        // BK Next 4 Ok
        config = _config;
        require(config.PUBLIC_SALE_SUPPLY() > 0);
        require(config.PRESALE_SUPPLY() > 0);
        require(config.TEAM_SUPPLY() > 0);
        require(config.ADVISORS_SUPPLY() > 0);

        // BK Next 2 Ok
        require(config.RESERVE_FUND_VALUE() > 0);
        require(config.DEVELOPMENT_FUND_VALUE() > 0);

        // BK Ok
        require(config.PRESALE_SUPPLY() > 0);

        // BK Next 4 Ok
        uint256 totalDistribution = config.PUBLIC_SALE_SUPPLY().add(config.PRESALE_SUPPLY());
        totalDistribution = totalDistribution.add(config.TEAM_SUPPLY()).add(config.ADVISORS_SUPPLY());
        totalDistribution = totalDistribution.add(config.RESERVE_FUND_VALUE()).add(config.DEVELOPMENT_FUND_VALUE());
        require(totalDistribution == config.TOTAL_SUPPLY());

        // BK Ok
        token = new AkropolisToken();
        // BK Ok
        AkropolisToken(token).pause();
    }


    // low level token purchase function
    // BK Ok - Anyone whitelisted can execute, sending ETH, within limits, within the appropriate time periods
    function buyTokens(address beneficiary) public payable {
        // BK Ok
        require(beneficiary != 0x0);
        // BK Ok
        require(validPurchase());

        // BK Ok
        uint256 weiAmount = msg.value;
        // BK Ok
        uint256 updatedWeiRaised = weiRaised.add(weiAmount);

        // BK Ok
        uint256 tokens = calculateTokens(weiAmount);

        // update state
        // BK Ok
        weiRaised = updatedWeiRaised;

        // BK Ok
        require(token.mint(beneficiary, tokens));

        // BK Ok
        contributions[msg.sender] = contributions[msg.sender].add(weiAmount);
        // BK Ok
        tokensSold = tokensSold.add(tokens);
        // BK Ok
        require(tokensSold <= config.PUBLIC_SALE_SUPPLY());
        
        // BK Ok - Log event
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        // BK Ok - Transfer funds to wallet
        forwardFunds();
    }

    // overriding Crowdsale#validPurchase to add checking if a buyer is within the cap
    // @return true if buyers can buy at the moment
    // BK Ok - Constant function
    function validPurchase() internal constant returns (bool) {
        // BK Ok - Whitelisted and within the correct tier
        bool isAdmitted = isBuyerAdmitted(msg.sender);
        // BK Ok
        bool isAboveMin = msg.value >= getMin(msg.sender);
        // BK Ok
        bool isBelowCap = msg.value <= getAvailableCap(msg.sender);
        // BK Ok - Call CappedCrowdsale.validPurchase() which checks that the contributed amount is within the global cap
        // BK Ok - and CappedCrowdsale.validPurchase() calls Crowdsale.validPurchase() which checks we are within the time period and a non-0 ETH amount was sent
        return super.validPurchase() && isAdmitted && isAboveMin && isBelowCap;
    }

    /**
    * Allows to end a crowdsale when all of the tokens allocated for the public sale are sold out
    */
    // BK Ok - View function
    function hasEnded() public view returns (bool) {
        // BK Ok
        bool tokensSoldOut = (tokensSold == config.PUBLIC_SALE_SUPPLY());
        return super.hasEnded() || tokensSoldOut;
    }

    // BK Ok - Only owner can execute
    function changeWallet(address _wallet) public onlyOwner {
        // BK Ok
        require(_wallet != 0x0);
        // BK Ok
        wallet = _wallet;
        // BK Ok - Log event
        WalletChange(_wallet);
    }

    /**
    * Overwrites the base OpenZeppelin function not to waste gas on an unnecessary token creation
    */
    // BK Ok - Internal function that disable deployment of token contract here
    function createTokenContract() internal returns (MintableToken) {
        // BK Ok
        return MintableToken(0x0);
    }

    /**
     * @dev Returns the bonus at the current moment in percents
     */
    // BK Ok - Internal function
    function finalization() internal {

        //Mint allocations
        // BK Ok - Check allocations have been deployed and set
        require(address(presaleAllocations) != 0x0 && address(teamAllocations) != 0x0 && address(advisorsAllocations) != 0x0);
        // BK Next 3 Ok
        token.mint(presaleAllocations, config.PRESALE_SUPPLY());
        token.mint(teamAllocations, config.TEAM_SUPPLY());
        token.mint(advisorsAllocations, config.ADVISORS_SUPPLY());

        //Mint special purpose funds
        // BK Ok - Check funds have been set
        require(reserveFund != 0x0 && developmentFund != 0x0);
        // BK Next 2 Ok
        token.mint(reserveFund, config.RESERVE_FUND_VALUE());
        token.mint(developmentFund, config.DEVELOPMENT_FUND_VALUE());


        //Calculate unsold tokens and send to the reserve
        // BK Ok
        uint256 unsold = config.PUBLIC_SALE_SUPPLY().sub(tokensSold);
        if (unsold > 0) {
            // BK Ok
            token.mint(reserveFund, unsold);
        }

        //Finish minting and release token
        // BK Ok
        token.finishMinting();
        // BK Ok
        AkropolisToken(token).unpause();
        // BK Ok
        token.transferOwnership(owner);
    }

    // BK Ok - Only owner can execute
    function setPresaleAllocations(AllocationsManager _presaleAllocations) public onlyOwner {
        // BK Ok
        presaleAllocations = _presaleAllocations;
    }

    // BK Ok - Only owner can execute
    function setTeamAllocations(AllocationsManager _teamAllocations) public onlyOwner {
        // BK Ok
        teamAllocations = _teamAllocations;
    }

    // BK Ok - Only owner can execute
    function setAdvisorsAllocations(AllocationsManager _advisorsAllocations) public onlyOwner {
        // BK Ok
        advisorsAllocations = _advisorsAllocations;
    }

    // BK Ok - Only owner can execute
    function setReserveFund(address _reserveFund) public onlyOwner {
        // BK Ok
        reserveFund = _reserveFund;
    }

    // BK Ok - Only owner can execute
    function setDevelopmentFund(address _developmentFund) public onlyOwner {
        // BK Ok
        developmentFund = _developmentFund;
    }

    /**
    * @dev Returns the number of AET tokens per contributed amount in wei
    *      including the early participants bonus
    */
    // BK Ok - Internal function
    function calculateTokens(uint256 _amountInWei) internal view returns(uint256) {
        // BK Ok
        return _amountInWei.mul(config.AET_RATE());
    }

    // BK Ok - View function
    function getAvailableCap(address _buyer) public view returns(uint256) {
        // BK Ok
        return getCap(_buyer).sub(contributions[_buyer]);
    }

}
```
