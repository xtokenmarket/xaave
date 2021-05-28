const { expect } = require('chai');
const { utils } = ethers
const { deploymentFixture } = require('./fixture');



describe('xAAVE: Fees', async () => {
    let wallet, user1, user2;

    let aave;
    let xaave;

    beforeEach(async () => {
        [wallet, user1, user2] = await ethers.getSigners();
        ({ xaave, aave } = await deploymentFixture());
    });

    it('should register full fees to the contract if affiliate is address(0)', async () => {
        const withdrawableAaveFeesBefore = await xaave.withdrawableAaveFees()
        
        const aaveAmount = utils.parseEther('20');
        await aave.approve(xaave.address, aaveAmount);
        const feeDivisors = await xaave.feeDivisors()
        const expectedFee = aaveAmount.div(feeDivisors.mintFee);
        
        await xaave.mintWithToken(aaveAmount, ethers.constants.AddressZero);
        
        const withdrawableAaveFeesAfter = await xaave.withdrawableAaveFees()

        expect(withdrawableAaveFeesAfter.sub(withdrawableAaveFeesBefore)).to.be.equal(expectedFee)
    })

    it('should register 3/4 fees to the contract with valid affiliate address passed as param and 1/4 fees to affiliate', async () => {
        await xaave.addToWhitelist(user2.address)
        
        const withdrawableAaveFeesBefore = await xaave.withdrawableAaveFees()
        
        const aaveAmount = utils.parseEther('20');
        await aave.approve(xaave.address, aaveAmount);

        const feeDivisors = await xaave.feeDivisors()
        const totalFee = aaveAmount.div(feeDivisors.mintFee)
        const expectedFeeToContract = totalFee.mul(3).div(4);
        
        await xaave.mintWithToken(aaveAmount, user2.address);
        
        const withdrawableAaveFeesAfter = await xaave.withdrawableAaveFees()

        expect(withdrawableAaveFeesAfter.sub(withdrawableAaveFeesBefore)).to.be.equal(expectedFeeToContract)
        
        const affiliateFeeBalance = await aave.balanceOf(user2.address)
        expect(affiliateFeeBalance).to.be.equal(totalFee.sub(expectedFeeToContract))
    })

    it('should revert if affiliate is not whitelisted', async () => {
        await xaave.removeFromWhitelist(user2.address)

        const aaveAmount = utils.parseEther('20');
        await aave.approve(xaave.address, aaveAmount);
        await expect(xaave.mintWithToken(aaveAmount, user2.address)).to.be.revertedWith('Invalid address');
    })


})