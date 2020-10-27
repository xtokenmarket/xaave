const { expect, assert } = require('chai');
const { utils, ethers } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');

describe('xAAVE: Mint/Burn', async () => {
	const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
	let xaave;

	before(async () => {
		({ xaave, aave } = await loadFixture(xaaveFixture));
	});

	it('should mint xAAVE tokens to user sending ETH', async () => {
		await xaave.mint('0', { value: utils.parseEther('0.01') });
		const xaaveBal = await xaave.balanceOf(wallet.address);
		expect(xaaveBal).to.be.gt(0);
	});

	it('should mint xAAVE tokens to user sending AAVE', async () => {
		const aaveAmount = utils.parseEther('10');
		await aave.transfer(user1.address, aaveAmount);
		await aave.connect(user1).approve(xaave.address, aaveAmount);
		await xaave.connect(user1).mintWithToken(aaveAmount);
		const xaaveBal = await xaave.balanceOf(user1.address);
		expect(xaaveBal).to.be.gt(0);
	});

	it('should burn xAAVE tokens for AAVE', async () => {
		const aaveBalBefore = await aave.balanceOf(wallet.address);
		const xaaveBal = await xaave.balanceOf(wallet.address);
		const bnBal = utils.bigNumberify(xaaveBal);

		const xaaveToRedeem = bnBal.div(utils.bigNumberify(100));
		await xaave.burn(xaaveToRedeem.toString(), false, 0);

		const aaveBalAfter = await aave.balanceOf(wallet.address);
		expect(aaveBalAfter).to.be.gt(aaveBalBefore);
	});

	it('should burn xAAVE tokens for ETH', async () => {
		await xaave.mint('0', { value: utils.parseEther('5') });
		const ethBalBefore = await provider.getBalance(wallet.address);
		const xaaveBal = await xaave.balanceOf(wallet.address);
		const bnBal = utils.bigNumberify(xaaveBal);

		const xaaveToRedeem = bnBal.div(utils.bigNumberify(100));
		await xaave.burn(xaaveToRedeem.toString(), true, 0);

		const ethBalAfter = await provider.getBalance(wallet.address);
		expect(ethBalAfter).to.be.gt(ethBalBefore);
	});

	it('should not mint with ETH if contract is paused', async () => {
		await xaave.pauseContract()
		await expect(xaave.mint('0', { value: utils.parseEther('0.01') })).to.be.revertedWith('Pausable: paused');
	});

	it('should not mint with SNX if contract is paused', async () => {
		const aaveAmount = utils.parseEther('10');
		await aave.transfer(user1.address, aaveAmount);
		await aave.connect(user1).approve(xaave.address, aaveAmount);
		await expect(xaave.connect(user1).mintWithToken(aaveAmount)).to.be.revertedWith('Pausable: paused');
	});
});
