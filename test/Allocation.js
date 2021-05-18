const { expect, assert } = require('chai');
const { utils } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { mineBlocks } = require('./helpers');
const { xaaveFixture } = require('./fixtures');

describe('xAAVE: Allocation', async () => {
	const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
	let xaave;

	before(async () => {
		({ xaave, aave, ETH_ADDRESS } = await loadFixture(xaaveFixture));
	});

	it('should hold a 5% AAVE buffer/reserve balance', async () => {
		const bufferTarget = utils.bigNumberify(20)
        const aaveAmount = utils.parseEther('20');
        const fee = utils.bigNumberify(aaveAmount).div(utils.bigNumberify('500'))
        const expectedBuffer = (utils.bigNumberify(aaveAmount).sub(fee)).div(bufferTarget)
        
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
		const bufferTarget = utils.bigNumberify(20)
		const supply = await xaave.totalSupply()
		const tokensToBurn = utils.bigNumberify(supply).div(utils.bigNumberify(100))
		await mineBlocks(5);
		await xaave.burn(tokensToBurn, false, 0)
		await mineBlocks(5);

		const bufferBalanceBefore = await xaave.getBufferBalance();
		const totalBalanceBefore = await xaave.getFundHoldings()

		// confirm buffer is under-allocated
		expect(utils.bigNumberify(bufferBalanceBefore).mul(bufferTarget)).to.be.lt(totalBalanceBefore)

		const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
		await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero)

		const bufferBalanceAfter = await xaave.getBufferBalance();
		const totalBalanceAfter = await xaave.getFundHoldings()

		// confirm buffer returned to expected
		expect(utils.bigNumberify(bufferBalanceAfter).mul(bufferTarget)).to.be.equal(totalBalanceAfter)
    })
});