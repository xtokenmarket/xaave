const { expect, assert } = require('chai');
const { utils } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');

describe('xAAVE: Mint/Burn', async () => {
	const provider = waffle.provider;
	const [wallet, user1] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet]);

	let aave;
	let xaave;

	before(async () => {
		({ xaave, aave, ETH_ADDRESS } = await loadFixture(xaaveFixture));
	});

	it('should mint xAAVE tokens to user sending ETH', async () => {
		await xaave.mint('0', { value: utils.parseEther('0.01') });
		const xaaveBal = await xaave.balanceOf(wallet.address);
		expect(xaaveBal).to.be.gt(0);
	});

	// it('should mint xBNT tokens to user sending BNT', async () => {
	// 	const bntAmount = utils.parseEther('10');
	// 	await bnt.transfer(user1.address, bntAmount);
	// 	await bnt.connect(user1).approve(xbnt.address, bntAmount);
	// 	await xbnt.connect(user1).mintWithToken(bntAmount);
	// 	const xbntBal = await xbnt.balanceOf(user1.address);
	// 	expect(xbntBal).to.be.gt(0);
	// });

	// it('should burn xBNT tokens and redeem BNT', async () => {
	// 	const bntBalBefore = await bnt.balanceOf(wallet.address);
	// 	const xbntBal = await xbnt.balanceOf(wallet.address);
	// 	const bnBal = utils.bigNumberify(xbntBal);

	// 	const xbntToRedeem = bnBal.div(utils.bigNumberify(100));
	// 	await xbnt.burn(xbntToRedeem.toString());

	// 	const bntBalAfter = await bnt.balanceOf(wallet.address);
	// 	expect(bntBalAfter).to.be.gt(bntBalBefore);
	// });
});
