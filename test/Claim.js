const { expect, assert } = require('chai');
const { utils } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');


describe('xAAVE: Claiming', async () => {
	const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
	let xaave;

	beforeEach(async () => {
		({ xaave, aave } = await loadFixture(xaaveFixture));
	});

	it('should register an increased AAVE buffer balance on claim', async () => {
        const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
		await xaave.mintWithToken(aaveAmount);
        
        const bufferBalanceBefore = await xaave.getBufferBalance();
        await xaave.claim();
        const bufferBalanceAfter = await xaave.getBufferBalance();
		expect(bufferBalanceAfter).to.be.gt(bufferBalanceBefore);
    });
    
    it('should be callable by a non-admin address', async () => {
        const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
        await xaave.mintWithToken(aaveAmount);
        
        const bufferBalanceBefore = await xaave.getBufferBalance();
        await xaave.connect(user1).claimExternal()
        const bufferBalanceAfter = await xaave.getBufferBalance();
        expect(bufferBalanceAfter).to.be.gt(bufferBalanceBefore);
    })

    it('should register the correct claim fee in AAVE', async () => {
        const aaveAmount = utils.parseEther('20');
		await aave.approve(xaave.address, aaveAmount);
        await xaave.mintWithToken(aaveAmount);

        const feeDivisors = await xaave.feeDivisors()
        const bufferBalanceBefore = await xaave.getBufferBalance();
        const withdrawableAaveFeesBefore = await xaave.withdrawableAaveFees()

        await xaave.claim();

        const withdrawableAaveFeesAfter = await xaave.withdrawableAaveFees()
        const feesGenerated = utils.bigNumberify(withdrawableAaveFeesAfter).sub(utils.bigNumberify(withdrawableAaveFeesBefore))
        const totalClaimSize = feesGenerated.mul(utils.bigNumberify(feeDivisors.claimFee))
        
        const bufferBalanceAfter = await xaave.getBufferBalance();
        const bufferBalanceIncrease = utils.bigNumberify(bufferBalanceAfter).sub(utils.bigNumberify(bufferBalanceBefore))

        expect(totalClaimSize).to.be.equal(utils.bigNumberify(bufferBalanceIncrease).add(utils.bigNumberify(feesGenerated)))
    })
});