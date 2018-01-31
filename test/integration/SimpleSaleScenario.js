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

contract('Akropolis TGE Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, buyer4, investor1, investor2, investor3,
																						reserveFund, bountyFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = 1000;

	const CONTRIBUTION_AMOUNT = ether(1);

	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;
	let tokenBuyerAmount;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(4);
		afterEndTime = endTime + duration.seconds(1);
	});

	it('should deploy AET token', async function () {
		token = await AkropolisToken.new().should.be.fulfilled;
		await token.pause().should.be.fulfilled;
	});


	it('should deploy Whitelist', async function () {
		whitelist = await Whitelist.new().should.be.fulfilled;
	});


	it('should register 4 users to the whitelist', async function () {
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer2, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer3, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer4, {from: admin}).should.be.fulfilled;
	});


	it('should deploy pre-sale allocations', async function() {
		presaleAllocations = await AllocationsManager.new().should.be.fulfilled;
		await presaleAllocations.setToken(token.address);


		teamAllocations = await AllocationsManager.new().should.be.fulfilled;
		await teamAllocations.setToken(token.address);
		await teamAllocations.setAdmin(admin);

		advisorsAllocations = await AllocationsManager.new().should.be.fulfilled;
		await advisorsAllocations.setToken(token.address);
		await advisorsAllocations.setAdmin(admin);
	});


	it('should register 3 presale investors', async function() {
		await presaleAllocations.setAdmin(admin);
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.fulfilled;
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), (VESTING_PERIOD * 2), {from: admin}).should.be.fulfilled;
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, {from: admin}).should.be.fulfilled;
	});


	it('should deploy Config', async function () {
		config = await SaleConfiguration.new().should.be.fulfilled;
	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsale.setAdmin(admin);
		await token.transferOwnership(crowdsale.address).should.be.fulfilled;
		await crowdsale.setToken(token.address).should.be.fulfilled;
		await crowdsale.setBaseCap(ether(3), {from: owner}).should.be.fulfilled;
		await crowdsale.setMaxCap(ether(10), {from: owner}).should.be.fulfilled;
		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;
	});


	it('should sell tokens to whitelisted users during round 1', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(CONTRIBUTION_AMOUNT);
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		let tokenBuyerAmountRound1 = tokenBuyerAmount.mul(1.2);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound1);
	});


	it('should sell tokens to whitelisted users during round 2', async function() {
		await increaseTimeTo(startTime + duration.days(1));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		let tokenBuyerAmountRound2 = tokenBuyerAmount.mul(1.1);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound2);
	});


	it('should sell tokens to whitelisted users during round 3', async function() {
		await increaseTimeTo(startTime + duration.days(2));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		let tokenBuyerAmountRound3 = tokenBuyerAmount.mul(1.05);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountRound3);
	});


	it('should sell tokens to whitelisted users during round 4', async function() {
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(4);
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmount);
	});


	it('should not allow for transfer of tokens', async function () {
		await token.transferFrom(investor1, unknown, ALLOCATED_VALUE, {from: investor1}).should.be.rejectedWith('revert');
		await token.transferFrom(buyer1, unknown, tokenBuyerAmount, {from: buyer1}).should.be.rejectedWith('revert');
	});


	it('should finalize crowdsale', async function() {
		await increaseTimeTo(afterEndTime);
		await crowdsale.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsale.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsale.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsale.setReserveFund(reserveFund, {from: owner});
		await crowdsale.setBountyFund(bountyFund, {from: owner});
		await crowdsale.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsale.finalize({from: owner}).should.be.fulfilled;

		//Test presale allocations
		(await token.balanceOf(presaleAllocations.address)).should.be.bignumber.equal((await config.PRESALE_SUPPLY()));

		//Test team allocations
		(await token.balanceOf(teamAllocations.address)).should.be.bignumber.equal((await config.TEAM_SUPPLY()));

		//Test advisors allocations
		(await token.balanceOf(advisorsAllocations.address)).should.be.bignumber.equal((await config.ADVISORS_SUPPLY()));

		//Test bounty fund
		(await token.balanceOf(bountyFund)).should.be.bignumber.equal((await config.BOUNTY_FUND_VALUE()));

		//Test dev fund
		(await token.balanceOf(developmentFund)).should.be.bignumber.equal((await config.DEVELOPMENT_FUND_VALUE()));

		//Test reserve fund
		let sold = await crowdsale.tokensSold();
		let supply = await config.PUBLIC_SALE_SUPPLY();
		let unsold = supply.sub(sold);
		(await token.balanceOf(reserveFund)).should.be.bignumber.equal((await config.RESERVE_FUND_VALUE()).add(unsold));
	});


	it('should distribute tokens among pre-sale users', async function() {
		await presaleAllocations.distributeAllocation(investor1, {from: owner});
		(await token.balanceOf(investor1)).should.be.bignumber.equal(ALLOCATED_VALUE);
		await presaleAllocations.distributeAllocation(investor2, {from: owner});
		(await token.balanceOf(investor2)).should.be.bignumber.equal(ALLOCATED_VALUE * 2);
		await presaleAllocations.distributeAllocation(investor3, {from: owner});
		(await token.balanceOf(investor3)).should.be.bignumber.equal(ALLOCATED_VALUE);
	});


	it('should correctly vest investors allocations', async function() {
		await increaseTimeTo(afterEndTime + VESTING_PERIOD);

		//Determine investor 1 token balance
		let vestingAddress = await presaleAllocations.getVesting(investor1);
		let vesting = await LinearTokenVesting.at(vestingAddress);
		await vesting.release(token.address);
		(await token.balanceOf(investor1)).should.be.bignumber.equal(ALLOCATED_VALUE + ALLOCATED_VESTING);

		//Determine investor 2 token balance
		vestingAddress = await presaleAllocations.getVesting(investor2);
		vesting = await LinearTokenVesting.at(vestingAddress);
		await vesting.release(token.address);
		(await token.balanceOf(investor2)).should.be.bignumber.equal((ALLOCATED_VALUE * 2) + (ALLOCATED_VESTING * 5));

		//Determine investor 3 token balance (did not receive vesting)
		(await token.balanceOf(investor3)).should.be.bignumber.equal(ALLOCATED_VALUE);

		await increaseTimeTo(afterEndTime + (VESTING_PERIOD * 2));
		(await token.balanceOf(investor2)).should.be.bignumber.equal((ALLOCATED_VALUE * 2) + (ALLOCATED_VESTING * 10));
	});


	it('should allow for transfer of tokens', async function () {
		await token.transferFrom(investor1, unknown, ALLOCATED_VALUE, {from: investor1}).should.be.fulfilled;
		await token.transferFrom(buyer1, unknown, tokenBuyerAmount, {from: buyer1}).should.be.fulfilled;
	})
});