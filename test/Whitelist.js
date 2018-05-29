const Whitelist = artifacts.require('./Whitelist.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

contract('Whitelist', function ([owner, admin, buyer1, buyer2, buyer3, wallet, notAdded]) {

	let whitelist;

	before(async function () {
		whitelist = await Whitelist.new();
	});


	it('should not allow anyone but the owner to define an admin for whitelist', async function () {
		await whitelist.setAdmin(admin, {from: buyer1}).should.be.rejectedWith('revert');
		await whitelist.setAdmin(admin, {from: wallet}).should.be.rejectedWith('revert');
		await whitelist.setAdmin(admin, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should allow the owner to define an admin', async function () {
		await whitelist.setAdmin(admin).should.be.fulfilled;
	});


	it('should not allow anyone but the admin to add to whitelist', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: buyer1}).should.be.rejectedWith('revert');
		await whitelist.addToWhitelist(buyer1, 1, {from: wallet}).should.be.rejectedWith('revert');
		await whitelist.addToWhitelist(wallet, 1, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow a null address to be whitelisted', async function () {
		await whitelist.addToWhitelist(0x0, 1, {from: admin}).should.be.rejectedWith('revert');
	});

	it('should not allow adding to tiers below or over 3', async function () {
		await whitelist.addToWhitelist(0x0, 0, {from: admin}).should.be.rejectedWith('revert');
		await whitelist.addToWhitelist(0x0, 4, {from: admin}).should.be.rejectedWith('revert');
	});

	it('should allow adding a buyer to the whitelist tier 1', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);
		(await whitelist.getWhitelistedAddress(0)).should.be.equal(buyer1);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
	});


	it('should not allow adding the same user to the whitelist twice', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow anyone but the admin to remove addresses from whitelist', async function () {
		await whitelist.removeFromWhitelist(buyer1, {from: buyer1}).should.be.rejectedWith('revert');
		await whitelist.removeFromWhitelist(buyer1, {from: wallet}).should.be.rejectedWith('revert');
		await whitelist.removeFromWhitelist(buyer1, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should allow admin to remove buyer from the whitelist', async function () {
		await whitelist.removeFromWhitelist(buyer1, {from: admin});
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(0);
	});


	it('should not allow removing the same address more than once', async function () {
		await whitelist.removeFromWhitelist(0x0, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow removing a user that has not been added to the whitelist', async function () {
		await whitelist.removeFromWhitelist(notAdded, {from: admin}).should.be.rejectedWith('revert');
	});

	it('should add two users to whitelist and then remove them in the same order', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.addToWhitelist(buyer2, 2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(true);
		(await whitelist.getTier(buyer2)).should.be.bignumber.equal(2);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(2);

		await whitelist.removeFromWhitelist(buyer1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer2)).should.be.equal(true);
		(await whitelist.getTier(buyer2)).should.be.bignumber.equal(2);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.removeFromWhitelist(buyer2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(0);

	});

	it('should add two users to whitelist and then remove them in the reverse order', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.addToWhitelist(buyer2, 2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(true);
		(await whitelist.getTier(buyer2)).should.be.bignumber.equal(2);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(2);

		await whitelist.removeFromWhitelist(buyer2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.removeFromWhitelist(buyer1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(0);

	});

	it('should add two users to whitelist and then remove them in the reverse order', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.addToWhitelist(buyer2, 2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(true);
		(await whitelist.getTier(buyer2)).should.be.bignumber.equal(2);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(2);

		await whitelist.removeFromWhitelist(buyer2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.removeFromWhitelist(buyer1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(0);

	});

	it('should add three users to whitelist and then remove starting from the middle one', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.addToWhitelist(buyer2, 2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(true);
		(await whitelist.getTier(buyer2)).should.be.bignumber.equal(2);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(2);

		await whitelist.addToWhitelist(buyer3, 3, {from: admin});

		(await whitelist.isWhitelisted(buyer3)).should.be.equal(true);
		(await whitelist.getTier(buyer3)).should.be.bignumber.equal(3);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(3);

		await whitelist.removeFromWhitelist(buyer2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.isWhitelisted(buyer3)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getTier(buyer3)).should.be.bignumber.equal(3);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(2);

		await whitelist.removeFromWhitelist(buyer1, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer3)).should.be.equal(true);
		(await whitelist.getTier(buyer3)).should.be.bignumber.equal(3);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.removeFromWhitelist(buyer3, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer3)).should.be.equal(false);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(0);

	});

	it('should allow adding multiple whitelisted users and remove them afterwards', async function () {
		var buyersAddresses = [buyer1, buyer2, buyer3];
		var buyersTiers = [1,2,3];
		await whitelist.addMultipleToWhitelist(buyersAddresses, buyersTiers, {from: admin});

		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.isWhitelisted(buyer2)).should.be.equal(true);
		(await whitelist.getTier(buyer2)).should.be.bignumber.equal(2);
		(await whitelist.isWhitelisted(buyer3)).should.be.equal(true);
		(await whitelist.getTier(buyer3)).should.be.bignumber.equal(3);

		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(3);

		await whitelist.removeFromWhitelist(buyer2, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(true);
		(await whitelist.isWhitelisted(buyer3)).should.be.equal(true);
		(await whitelist.getTier(buyer1)).should.be.bignumber.equal(1);
		(await whitelist.getTier(buyer3)).should.be.bignumber.equal(3);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(2);

		await whitelist.removeFromWhitelist(buyer1, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer3)).should.be.equal(true);
		(await whitelist.getTier(buyer3)).should.be.bignumber.equal(3);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(1);

		await whitelist.removeFromWhitelist(buyer3, {from: admin});

		(await whitelist.isWhitelisted(buyer2)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer1)).should.be.equal(false);
		(await whitelist.isWhitelisted(buyer3)).should.be.equal(false);
		(await whitelist.getWhitelistedCount()).should.be.bignumber.equal(0);
	});

	it('should not allow adding multiple whitelisted users with differing lengths of addresses and tiers', async function () {
		var buyersAddresses = [buyer1, buyer2, buyer3];
		//Tiers not synchronized with addresses
		var buyersTiers = [1,2];
		await whitelist.addMultipleToWhitelist(buyersAddresses, buyersTiers, {from: admin}).should.be.rejectedWith('revert');
	});

});