const { expect, assert } = require('chai');
const { utils, ethers } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');

describe('xAAVE: Proxy', async () => {
	const provider = waffle.provider;
	const [wallet, cosigner1, cosigner2, random] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, cosigner1, cosigner2]);

	let xaaveProxy;
	let implementation;
	let kyber;
	let stakedAave;

	beforeEach(async () => {
		({ xaaveProxy, implementation, kyber, stakedAave } = await loadFixture(xaaveFixture));
	});

	it('Should display correct co-signer 1, co-signer 2, admin, and implementation addresses', async () => {
		expect(await xaaveProxy.proxySigner(0)).to.be.equal(cosigner1.address);
		expect(await xaaveProxy.proxySigner(1)).to.be.equal(cosigner2.address);
		expect(await xaaveProxy.proxyAdmin()).to.be.equal(wallet.address);
		expect(await xaaveProxy.implementation()).to.be.equal(implementation);
	});

	it('should not let admin propose a non-contract address as new implementation', async () => {
		await expect(xaaveProxy.proposeNewImplementation(cosigner1.address)).to.be.revertedWith(
			'new proposed implementation is not a contract'
		);
	});

	it('Should not let non-admins propose new implementations', async () => {
		// use kyber as example new impl address
		await expect(xaaveProxy.connect(cosigner1).proposeNewImplementation(kyber.address)).to.be.revertedWith();
		await expect(xaaveProxy.connect(random).proposeNewImplementation(kyber.address)).to.be.revertedWith();
		await xaaveProxy.proposeNewImplementation(kyber.address);
		expect(await xaaveProxy.proposedNewImplementation()).to.be.equal(kyber.address);
	});

	it('Should be approved only by a co-signer and with the correct address', async () => {
		await xaaveProxy.proposeNewImplementation(kyber.address);
		await expect(xaaveProxy.confirmImplementation(kyber.address)).to.be.revertedWith();
		await expect(xaaveProxy.connect(cosigner1).confirmImplementation(stakedAave.address)).to.be.revertedWith(); // incorrect impl address
		await xaaveProxy.connect(cosigner1).confirmImplementation(kyber.address);
		expect(await xaaveProxy.implementation()).to.be.equal(kyber.address);
	});
});
