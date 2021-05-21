const { expect } = require('chai');
const { utils, ethers } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { mineBlocks } = require('./helpers');
const { xaaveFixture } = require('./fixtures');

// Block locking tests for xAAVE
describe('xAAVE: BlockLock', async () => {
    const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
	let xaave;

	beforeEach(async () => {
		({ xaave, aave } = await loadFixture(xaaveFixture));
        const amount = utils.parseEther('10');
        await xaave.mint('0', { value: amount});
        await mineBlocks(5);
        await xaave.transfer(user1.address, amount);
        await mineBlocks(5);
        await xaave.transfer(user2.address, amount);
        await mineBlocks(5);
	});

    it('account shouldn\'t be able to call mint, burn and transfer before 6 blocks have been mined', async () => {
        const aaveAmount = utils.parseEther('10');
        await xaave.mint('0', { value: utils.parseEther('5') });
        await expect(xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero)).
            to.be.reverted;
        await expect(xaave.burn(aaveAmount, true, 0)).
            to.be.reverted;
        await expect(xaave.transfer(user1.address, aaveAmount)).
            to.be.reverted;
    }),

    it('account shouldn\'t be able to call burn, mint and transfer before 6 blocks have been mined', async () => {
        const aaveAmount = utils.parseEther('10');
        await xaave.burn(aaveAmount, true, 0);
        await expect(xaave.mint('0', { value: utils.parseEther('5') })).
            to.be.reverted;
        await expect(xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero)).
            to.be.reverted;
        await expect(xaave.transfer(user1.address, aaveAmount)).
            to.be.reverted;
    }),

    it(`no account should be able to call transferFrom from sender address
        which has called mint before 6 blocks have been mined`, async () => {
        await xaave.approve(user1.address, 1);
        await xaave.approve(user2.address, 1);
        await xaave.mint('0', { value: utils.parseEther('5') });
        await expect(xaave.connect(user1).transferFrom(wallet.address, user1.address, 1)).
            to.be.reverted;
        await expect(xaave.connect(user2).transferFrom(wallet.address, user1.address, 1)).
            to.be.reverted;
    }),

    it(`no account should be able to call transferFrom from sender address
        which has called burn before 6 blocks have been mined`, async () => {
        await xaave.approve(user1.address, 1);
        await xaave.approve(user2.address, 1);
        await xaave.burn(1, true, 0);
        await expect(xaave.connect(user1).transferFrom(wallet.address, user1.address, 1)).
            to.be.reverted;
        await expect(xaave.connect(user2).transferFrom(wallet.address, user1.address, 1)).
            to.be.reverted;
    }),

    it('account should be able to call mint, burn, transfer or transferFrom if >= 6 blocks have been mined', async () => {
        const aaveAmount = utils.parseEther('10');
        await xaave.mint('0', { value: aaveAmount });
        await mineBlocks(5);
        await xaave.burn(aaveAmount, true, 0);
        await mineBlocks(5);
        await xaave.transfer(user1.address, aaveAmount);
        await mineBlocks(5);
        await xaave.approve(user1.address, 1);
        await xaave.connect(user1).transferFrom(wallet.address, user1.address, 1);
    }),

    it('other accounts should be able to call mint even if one is locked', async () => {
        const ethAmount = utils.parseEther('10');
        await xaave.mint('0', { value: ethAmount });
        await expect(xaave.mint('0', { value: ethAmount })).
            to.be.reverted;
        await xaave.connect(user1).mint('0', { value: ethAmount });
        await xaave.connect(user2).mint('0', { value: ethAmount });
    }),

    it('other accounts should be able to call burn even if one is locked', async () => {
        const aaveAmount = utils.parseEther('10');
        await xaave.burn(aaveAmount, true, 0);
        await expect(xaave.burn(aaveAmount, true, 0)).
            to.be.reverted;
        await xaave.connect(user1).burn(aaveAmount, true, 0);
        await xaave.connect(user2).burn(aaveAmount, true, 0);
    }),

    it('other accounts should be able to call transfer even if one is locked', async () => {
        const ethAmount = utils.parseEther('10');
        await xaave.mint('0', { value: ethAmount });
        await expect(xaave.transfer(user1.address, ethAmount)).
            to.be.reverted;
        await xaave.connect(user1).transfer(user2.address, ethAmount);
        await xaave.connect(user2).transfer(user1.address, ethAmount);
    }),

    it('other accounts should be able to call transferFrom even if one is locked', async () => {
        await xaave.approve(user1.address, 1);
        await xaave.approve(user2.address, 1);
        await xaave.connect(user1).approve(user2.address, 1);
        await xaave.connect(user2).approve(user1.address, 1);
        const ethAmount = utils.parseEther('10');
        await xaave.mint('0', { value: ethAmount });
        await expect(xaave.connect(user1).transferFrom(wallet.address, user1.address, 1)).
            to.be.reverted;
        await expect(xaave.connect(user2).transferFrom(wallet.address, user2.address, 1)).
            to.be.reverted;
        await xaave.connect(user1).transferFrom(user2.address, user1.address, 1);
        await xaave.connect(user2).transferFrom(user1.address, user2.address, 1);
    })
})