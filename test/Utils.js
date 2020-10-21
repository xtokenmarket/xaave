const { expect, assert } = require('chai');
const { utils, ethers } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');

describe('xAAVE: Utils', async () => {
	const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
	let xaave;

	before(async () => {
		({ xaave, aave } = await loadFixture(xaaveFixture));
	});

	it('should not allow non-admin to pause', async () => {
		await expect(xaave.connect(user2).pauseContract()).to.be.revertedWith('Ownable: caller is not the owner');
	});

	it('should allow admin to pause', async () => {
		await xaave.pauseContract();
		const isPaused = await xaave.paused()
		expect(isPaused).to.be.equal(true)
	});

	it('should not allow non-admin to unpause', async () => {
		await expect(xaave.connect(user2).unpauseContract()).to.be.revertedWith('Ownable: caller is not the owner');
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
    
	it('should be able to approve staking contract', async () => {
        await xaave.approveStakingContract()
        assert(true)
	});

	it('should be able to approve Kyber contract', async () => {
        await xaave.approveKyberContract(aave.address)
        assert(true)
	});

	it('should be able to certify admin', async () => {
        await xaave.certifyAdmin()
        const adminTimestamp = await xaave.adminActiveTimestamp()
        // console.log('adminTimestamp', adminTimestamp.toString())
        // console.log('block', ethers.providers.getBlock)
        // expect(utils.bigNumberify(adminTimestamp).add(utils.bigNumberify(10))).to.be.gt()
	});
});
