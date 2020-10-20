const { expect, assert } = require('chai');
const { utils } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');

describe('xAAVE: Allocation', async () => {
	const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
	let xaave;
	let xaaveProxyCast;

	before(async () => {
		({ xaave, aave, ETH_ADDRESS } = await loadFixture(xaaveFixture));
	});

	it('should hold a 5% AAVE buffer/reserve balance', async () => {
        const aaveAmount = utils.parseEther('20');
        const fee = utils.bigNumberify(aaveAmount).div(utils.bigNumberify('500'))
        const expectedBuffer = (utils.bigNumberify(aaveAmount).sub(fee)).div(utils.bigNumberify('20'))
        
		await aave.approve(xaave.address, aaveAmount);
		await xaave.mintWithToken(aaveAmount);
        
        const bufferBalance = await xaave.getBufferBalance();
		expect(bufferBalance).to.be.equal(expectedBuffer.toString());
    });
    
    it('should register a staked aave balance after mint', async () => {
        const stakedBal = await xaave.getStakedBalance()
		expect(stakedBal).to.be.gt(0);
    })
});