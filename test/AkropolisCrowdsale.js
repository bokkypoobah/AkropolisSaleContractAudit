import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfigurationMock = artifacts.require('./SaleConfigurationMock.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Akropolis Crowdsale', function ([owner, admin, buyer, wallet, bonusBuyer1, bonusBuyer2, bonusBuyer3, bonusBuyer4,
																					 presaleAllocations, teamAllocations, advisorsAllocations,
																					 reserveFund, developmentFund]) {

	let token, crowdsale, whitelist, config;
	let startTime, endTime, afterEndTime;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.weeks(2);
		afterEndTime = endTime + duration.seconds(1);

		whitelist = await Whitelist.new();

		config = await SaleConfigurationMock.new();
	});

	it('should fail to validate configuration for AKT_RATE == 0', async function () {
		await config.setAKT_RATE(0);
		await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.rejectedWith('revert');
	});


	it('should create a crowdsale for valid configuration', async function () {
		await config.setAKT_RATE(10);
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address);
		token = await AkropolisToken.at(await crowdsale.token());
	});


	it('should create the sale with the correct parameters', async function () {
    (await crowdsale.startTime()).should.be.bignumber.equal(startTime);
		(await crowdsale.endTime()).should.be.bignumber.equal(endTime);
		(await crowdsale.wallet()).should.be.equal(wallet);
	});


	it('should not accept money before the start', async function() {
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});


	it('should not accept non-whitelisted users after the start', async function() {
		await increaseTimeTo(startTime);
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});


	it('should not allow for invalid wallet change address', async function() {
		await crowdsale.changeWallet(0x0, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow wallet change by anyone but owner', async function() {
		await crowdsale.changeWallet(wallet, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.changeWallet(wallet, {from: buyer}).should.be.rejectedWith('revert');
	});


	it('should allow owner to change wallet', async function() {
		await crowdsale.changeWallet(buyer, {from: owner}).should.be.fulfilled;
		(await crowdsale.wallet()).should.be.equal(buyer);
		await crowdsale.changeWallet(wallet, {from: owner}).should.be.fulfilled;
		(await crowdsale.wallet()).should.be.equal(wallet);
	});


	it('should accept whitelisted users and update available cap', async function() {
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer, 1, {from: admin});

		(await crowdsale.getAvailableCap(buyer)).should.be.bignumber.equal(ether(10));

		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(2)}).should.be.fulfilled;

		(await crowdsale.getAvailableCap(buyer)).should.be.bignumber.equal(ether(8));
	});


	it('should not allow setting null beneficiary when buying tokens', async function() {
		await crowdsale.buyTokens(0x0, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});


	it('should not allow exceeding the available cap', async function() {
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(8.01)}).should.be.rejectedWith('revert');
	});

	it('should not allow buying below the minimal limit', async function() {
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1.99)}).should.be.rejectedWith('revert');
	});

	it('should not allow finalization by anyone other than owner', async function() {
		await crowdsale.finalize({from: admin}).should.be.rejectedWith('revert');
		await crowdsale.finalize({from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.finalize({from: buyer}).should.be.rejectedWith('revert');
	});

	it('should not allow finalizing without all allocations and funds defined', async function() {
		await increaseTimeTo(endTime + 1);
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');

		await crowdsale.setPresaleAllocations(presaleAllocations, {from: owner});
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');

		await crowdsale.setTeamAllocations(teamAllocations, {from: owner});
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');

		await crowdsale.setAdvisorsAllocations(advisorsAllocations, {from: owner});
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');

		await crowdsale.setReserveFund(reserveFund, {from: owner});
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');

		await crowdsale.setDevelopmentFund(developmentFund, {from: owner});
		await crowdsale.finalize({from: owner}).should.be.fulfilled;
	});


	it('should mint unsold tokens', async function() {
		let sold = await crowdsale.tokensSold();
		let supply = await config.PUBLIC_SALE_SUPPLY();
		let unsold = supply.sub(sold);
		let reserve = await config.RESERVE_FUND_VALUE();

		(await token.balanceOf(reserveFund)).should.be.bignumber.equal(reserve.add(unsold));
	});


	it('should have a correct token state after the crowdsale finalization', async function() {
		(await token.owner()).should.be.equal(owner);
		(await token.paused()).should.be.equal(false);
		(await token.mintingFinished()).should.be.equal(true);
	});

});