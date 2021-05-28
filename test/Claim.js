const { expect } = require('chai');
const { ethers } = require('hardhat');
const { utils } = ethers
const { deploymentFixture } = require('./fixture');
const { bn } = require('./helpers');



describe('xAAVE: Claiming', async () => {
	let wallet, user1, user2;

	let aave;
	let xaave;

	beforeEach(async () => {
        [wallet, user1, user2] = await ethers.getSigners();
		({ xaave, aave } = await deploymentFixture());
	});

	it('should register an increased AAVE buffer balance on claim', async () => {
        const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
        await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero);
        
        const bufferBalanceBefore = await xaave.getBufferBalance();
        await xaave.claim();
        const bufferBalanceAfter = await xaave.getBufferBalance();
		expect(bufferBalanceAfter).to.be.gt(bufferBalanceBefore);
    });
    
    it('should be callable by a non-admin address', async () => {
        const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
        await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero);
        
        const bufferBalanceBefore = await xaave.getBufferBalance();
        await xaave.connect(user1).claimExternal()
        const bufferBalanceAfter = await xaave.getBufferBalance();
        expect(bufferBalanceAfter).to.be.gt(bufferBalanceBefore);
    })

    it('should register the correct claim fee in AAVE', async () => {
        const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
        await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero);

        const feeDivisors = await xaave.feeDivisors()
        const bufferBalanceBefore = await xaave.getBufferBalance();
        const withdrawableAaveFeesBefore = await xaave.withdrawableAaveFees()

        await xaave.claim();

        const withdrawableAaveFeesAfter = await xaave.withdrawableAaveFees()
        const feesGenerated = bn(withdrawableAaveFeesAfter).sub(bn(withdrawableAaveFeesBefore))
        const totalClaimSize = feesGenerated.mul(bn(feeDivisors.claimFee))
        
        const bufferBalanceAfter = await xaave.getBufferBalance();
        const bufferBalanceIncrease = bn(bufferBalanceAfter).sub(bn(bufferBalanceBefore))

        expect(totalClaimSize).to.be.equal(bn(bufferBalanceIncrease).add(bn(feesGenerated)))
    })
});