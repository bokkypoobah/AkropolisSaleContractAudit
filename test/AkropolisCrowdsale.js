import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Akropolis Crowdsale', function ([owner, admin, buyer, wallet, bonusBuyer1, bonusBuyer2, bonusBuyer3, bonusBuyer4, newTokenOwner]) {

	let token, crowdsale;
	let startTime, endTime, afterEndTime;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.weeks(1);
		afterEndTime = endTime + duration.seconds(1);

		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet);
		token = AkropolisToken.at(await crowdsale.token());
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


	it('should not allow releasing token by anyone but owner', async function() {
		await crowdsale.releaseToken(wallet, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.releaseToken(wallet, {from: buyer}).should.be.rejectedWith('revert');
	});


	it('should allow owner to change wallet', async function() {
		await crowdsale.changeWallet(buyer, {from: owner}).should.be.fulfilled;
		(await crowdsale.wallet()).should.be.equal(buyer);
		await crowdsale.changeWallet(wallet, {from: owner}).should.be.fulfilled;
		(await crowdsale.wallet()).should.be.equal(wallet);
	});


	it('should set up increasing cap', async function() {
		await crowdsale.setBaseCap(ether(3), {from: owner}).should.be.fulfilled;
		await crowdsale.setMaxCap(ether(10), {from: owner}).should.be.fulfilled;
		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;

		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		(await crowdsale.getCurrentCap()).should.be.bignumber.equal(ether(3));
		(await crowdsale.getAvailableCap(buyer)).should.be.bignumber.equal(ether(3));
	});


	it('should accept whitelisted users and update available cap', async function() {
		await crowdsale.setAdmin(admin);
		await crowdsale.addToWhitelist(buyer, {from: admin});

		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.fulfilled;

		(await crowdsale.getAvailableCap(buyer)).should.be.bignumber.equal(ether(2));
	});


	it('should not allow exceeding the available cap', async function() {
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(2.01)}).should.be.rejectedWith('revert');
	});


	it('should calculate bonus (Round 1)', async function() {
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		(await crowdsale.getCurrentBonus()).should.be.bignumber.equal(20);

		await crowdsale.buyTokens(bonusBuyer1, {from: buyer, value: ether(1)});

		(await token.balanceOf(bonusBuyer1)).should.be.bignumber.equal(ether(12));
	});


	it('should calculate bonus (Round 2)', async function() {
		await increaseTimeTo(startTime + duration.days(1));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);
		(await crowdsale.getCurrentBonus()).should.be.bignumber.equal(10);

		await crowdsale.buyTokens(bonusBuyer2, {from: buyer, value: ether(1)});

		(await token.balanceOf(bonusBuyer2)).should.be.bignumber.equal(ether(11));
	});


	it('should calculate bonus (Round 3)', async function() {
		await increaseTimeTo(startTime + duration.days(2));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);
		(await crowdsale.getCurrentBonus()).should.be.bignumber.equal(5);

		await crowdsale.buyTokens(bonusBuyer3, {from: buyer, value: ether(1)});

		(await token.balanceOf(bonusBuyer3)).should.be.bignumber.equal(ether(10.5));
	});


	it('should calculate bonus (Round 4)', async function() {
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(4);
		(await crowdsale.getCurrentBonus()).should.be.bignumber.equal(0);

		await crowdsale.buyTokens(bonusBuyer4, {from: buyer, value: ether(1)});

		(await token.balanceOf(bonusBuyer4)).should.be.bignumber.equal(ether(10));
	});


	it('should not release token in crowdsale is not finalized', async function() {
		await crowdsale.releaseToken(newTokenOwner, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should release the token to the new owner', async function() {
		await increaseTimeTo(endTime + 1);
		await crowdsale.finalize({from: owner});
		await crowdsale.releaseToken(newTokenOwner, {from: owner}).should.be.fulfilled;

		(await token.owner()).should.be.equal(newTokenOwner);
	});


	it('should not release the token by anyone other than owner', async function() {
		await crowdsale.releaseToken(newTokenOwner, {from: admin}).should.be.rejectedWith('revert');
		await crowdsale.releaseToken(newTokenOwner, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.releaseToken(newTokenOwner, {from: buyer}).should.be.rejectedWith('revert');
	});

});