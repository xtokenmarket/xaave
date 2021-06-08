const { expect, assert } = require('chai');
const { ethers } = require('hardhat');
const { utils } = ethers
const { deploymentFixture } = require('./fixture');
const { mineBlocks } = require('./helpers');

describe('xAAVE: Utils', async () => {
	let wallet, user1, user2;

	let aave;
	let xaave;

	before(async () => {
        [wallet, user1, user2] = await ethers.getSigners();
		({ xaave, aave } = await deploymentFixture());
	});

	it('should not allow non-admin to pause', async () => {
		await expect(xaave.connect(user2).pauseContract()).to.be.revertedWith('Non-admin caller');
	});

	it('should allow admin to pause', async () => {
		await xaave.pauseContract();
		const isPaused = await xaave.paused()
		expect(isPaused).to.be.equal(true)
	});

	it('should not allow non-admin to unpause', async () => {
		await expect(xaave.connect(user2).unpauseContract()).to.be.revertedWith('Non-admin caller');
	});

	it('should allow admin to unpause', async () => {
		await xaave.unpauseContract()
		const isPaused = await xaave.paused()
		expect(isPaused).to.be.equal(false)
	});

	it('should be able to appoint a fund manager', async () => {
		await xaave.setManager(user2.address);
		assert(true);
	});

	it('should allow the manager to call admin functions', async () => {
		await xaave.connect(user2).claim();
		assert(true);
	});

	it('should not allow non-manager to call admin functions', async () => {
		await expect(xaave.connect(user1).claim()).to.be.revertedWith('Non-admin caller');
	});

	it('should be able to vote in governance', async () => {
		await expect(xaave.connect(user1).claim()).to.be.revertedWith('Non-admin caller');
    });

	it('should be able to certify admin', async () => {
        const adminTimestampBefore = await xaave.adminActiveTimestamp()
        await xaave.certifyAdmin()
        const adminTimestampAfter = await xaave.adminActiveTimestamp()
		expect(adminTimestampAfter).to.be.gt(adminTimestampBefore)
	});

	it('should be able to recover tokens errantly transferred to contract', async () => {
        await xaave.mint('0', { value: utils.parseEther('0.01') });
		await mineBlocks(5);
		const xaaveBal = await xaave.balanceOf(wallet.address)

		await xaave.transfer(xaave.address, xaaveBal)
		const contractBal = await xaave.balanceOf(xaave.address)
		expect(contractBal).to.be.gt(0)

		await xaave.withdrawNativeToken()
		const contractBalAfter = await xaave.balanceOf(xaave.address)
		expect(contractBalAfter).to.be.equal(0)
	});

	it('should allow admin to collect fees', async () => {
		await mineBlocks(5);
		await xaave.mint('0', { value: utils.parseEther('1') });
		await mineBlocks(5);
		const aaveAmount = utils.parseEther('10');
		await aave.approve(xaave.address, aaveAmount);
		await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero);

        const adminEthBalanceBefore = await ethers.provider.getBalance(wallet.address)
        const adminAaveBalanceBefore = await aave.balanceOf(wallet.address)
        const contractEthFeeBalBefore = await ethers.provider.getBalance(xaave.address)
		const contractAaveFeeBalBefore = await xaave.withdrawableAaveFees()

		expect(contractEthFeeBalBefore).to.be.gt(0)
		expect(contractAaveFeeBalBefore).to.be.gt(0)

		await xaave.withdrawFees()
		
        const adminEthBalanceAfter = await ethers.provider.getBalance(wallet.address)
		const adminAaveBalanceAfter = await aave.balanceOf(wallet.address)
        const contractEthFeeBalAfter = await ethers.provider.getBalance(xaave.address)
		const contractAaveFeeBalAfter = await xaave.withdrawableAaveFees()

		expect(adminEthBalanceAfter).to.be.gt(adminEthBalanceBefore)
		expect(adminAaveBalanceAfter).to.be.gt(adminAaveBalanceBefore)
		expect(contractEthFeeBalAfter).to.be.equal(0)
		expect(contractAaveFeeBalAfter).to.be.equal(0)
	});
});
