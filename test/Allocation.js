const { expect } = require('chai');
const { ethers } = require('hardhat');
const { utils } = ethers
const { deploymentFixture } = require('./fixture');
const { mineBlocks, bn } = require('./helpers');

describe('xAAVE: Allocation', async () => {
	let wallet, user1, user2;

	let aave;
	let xaave;

	before(async () => {
		[wallet, user1, user2] = await ethers.getSigners();
		({ xaave, aave, ETH_ADDRESS } = await deploymentFixture());
	});

	it('should hold a 5% AAVE buffer/reserve balance', async () => {
		const bufferTarget = bn(20)
        const aaveAmount = utils.parseEther('20');
        const fee = bn(aaveAmount).div(bn('500'))
        const expectedBuffer = (bn(aaveAmount).sub(fee)).div(bufferTarget)
        
		await aave.approve(xaave.address, aaveAmount);
		await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero);
        
		const bufferBalance = await xaave.getBufferBalance();
		expect(bufferBalance).to.be.equal(expectedBuffer.toString());
    });
    
    it('should register a staked aave balance after mint', async () => {
        const stakedBal = await xaave.getStakedBalance()
		expect(stakedBal).to.be.gt(0);
    })
    
    it('should refill the buffer balance on mint after a burn', async () => {
		const bufferTarget = bn(20)
		const supply = await xaave.totalSupply()
		const tokensToBurn = bn(supply).div(bn(100))
		await mineBlocks(5);
		await xaave.burn(tokensToBurn, false, 0)
		await mineBlocks(5);

		const bufferBalanceBefore = await xaave.getBufferBalance();
		const totalBalanceBefore = await xaave.getFundHoldings()

		// confirm buffer is under-allocated
		expect(bn(bufferBalanceBefore).mul(bufferTarget)).to.be.lt(totalBalanceBefore)

		const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
		await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero)

		const bufferBalanceAfter = await xaave.getBufferBalance();
		const totalBalanceAfter = await xaave.getFundHoldings()

		// confirm buffer returned to expected
		expect(bn(bufferBalanceAfter).mul(bufferTarget)).to.be.equal(totalBalanceAfter)
    })
});