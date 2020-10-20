const { expect, assert } = require('chai');
const { utils, ethers } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');
const { increaseTime } = require('./helpers')

describe('xAAVE: Cooldown', async () => {
	const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
	let xaave;

	beforeEach(async () => {
		({ xaave, aave } = await loadFixture(xaaveFixture));
	});

	it('should allow admin to trigger a cooldown period', async () => {
		await xaave.mint('0', { value: utils.parseEther('0.01') });

		await xaave.cooldown();
		assert(true);
	});

	it('should not allow non-admin to trigger a cooldown period', async () => {
		await expect(xaave.connect(user2).cooldown()).to.be.revertedWith('Non-admin caller');
	});

	it('should prevent AAVE from being staked during a cooldown period', async () => {
		await xaave.mint('0', { value: utils.parseEther('0.01') });
		const stakedBalBefore = await xaave.getStakedBalance();

		await xaave.cooldown();
		await xaave.mint('0', { value: utils.parseEther('0.01') });
		const stakedBalAfter = await xaave.getStakedBalance();

		expect(stakedBalBefore).to.be.equal(stakedBalAfter);
	});

	it('should not allow non-admin to trigger emergency cooldown period before liquidation time period', async () => {
		await xaave.mint('0', { value: utils.parseEther('0.01') });

		const threeWeeks = 60 * 60 * 24 * 7 * 3;
		await increaseTime(threeWeeks);
		await expect(xaave.connect(user2).emergencyCooldown()).to.be.revertedWith("Liquidation time hasn't elapsed");
	});

	it('should allow non-admin to trigger emergency cooldown period after liquidation time period', async () => {
		await xaave.mint('0', { value: utils.parseEther('0.01') });

		const fiveWeeks = 60 * 60 * 24 * 7 * 5;
		await increaseTime(fiveWeeks)
		await xaave.connect(user2).emergencyCooldown();
		assert(true);
	});
});