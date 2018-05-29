import { advanceBlock } from '.././tools/advanceToBlock';
import { increaseTimeTo, duration } from '.././tools/increaseTime';
import latestTime from '.././tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfiguration = artifacts.require('./SaleConfiguration.sol');
const AllocationsManager = artifacts.require('./AllocationsManager.sol');
const LinearTokenVesting = artifacts.require('./LinearTokenVesting.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

//This integration test seeks to explore finalizing the crowdsale at inappropriate times
//Test sets up a simple crowdsale which does not reach the public sale supply of tokens nor the maximum ether contribution
//We test to ensure that the crowdsale will not finalize until the time of the 4 round durations is over
contract('Akropolis Finalizing Crowdsale Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, buyer4, investor1, investor2, investor3,
																						reserveFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = duration.days(100);
	const VESTING_CLIFF = duration.days(25);

	const CONTRIBUTION_AMOUNT = ether(2);

	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;
	let tokenBuyerAmount;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(9);
		afterEndTime = endTime + duration.seconds(1);
		whitelist = await Whitelist.new();
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});
		await whitelist.addToWhitelist(buyer2, 1, {from: admin});
		await whitelist.addToWhitelist(buyer3, 1, {from: admin});
		await whitelist.addToWhitelist(buyer4, 1, {from: admin});

	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfiguration.new().should.be.fulfilled;
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		token = await AkropolisToken.at(await crowdsale.token());
	});


	it('should register allocations', async function() {
		presaleAllocations = await AllocationsManager.new();
		await presaleAllocations.setToken(token.address);
		await presaleAllocations.setAdmin(admin);

		teamAllocations = await AllocationsManager.new();
		await teamAllocations.setToken(token.address);
		await teamAllocations.setAdmin(admin);

		advisorsAllocations = await AllocationsManager.new();
		await advisorsAllocations.setToken(token.address);
		await advisorsAllocations.setAdmin(admin);
		config = await SaleConfiguration.new();

		//Register some investors
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), VESTING_CLIFF, (VESTING_PERIOD * 2), {from: admin});
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, 0, {from: admin});
	});


	it('should not finalize the sale before the start time', async function () {
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');
	});


	it('should sell tokens to whitelisted users during round 1', async function() {
		tokenBuyerAmount = (await config.AKT_RATE()).mul(CONTRIBUTION_AMOUNT);
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmount);
	});


	it('should not finalize the sale before the end of token sale or reach the hard cap', async function () {
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow for transfer of tokens', async function () {
		await token.transfer(unknown, 1, {from: buyer1}).should.be.rejectedWith('revert');
		await token.approve(unknown, 1, {from: buyer1}).should.be.rejectedWith('revert');
		await token.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.rejectedWith('revert');
	})


	it('should finalize crowdsale after reaching time', async function() {
		await increaseTimeTo(afterEndTime);
		await crowdsale.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsale.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsale.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsale.setReserveFund(reserveFund, {from: owner});
		await crowdsale.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsale.finalize({from: owner}).should.be.fulfilled;

		//Test reserve fund
		let sold = await crowdsale.tokensSold();
		let supply = await config.PUBLIC_SALE_SUPPLY();
		let unsold = supply.sub(sold);
		(await token.balanceOf(reserveFund)).should.be.bignumber.equal((await config.RESERVE_FUND_VALUE()).add(unsold));
	});


	it('should allow for transfer of tokens', async function () {
		await token.transfer(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await token.approve(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await token.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.fulfilled;
	})
});