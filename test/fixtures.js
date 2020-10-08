const { Contract, utils } = require('ethers');
const { deployContract } = require('ethereum-waffle');

const xAAVE = require('../artifacts/xAAVE.json');
const AAVE = require('../artifacts/MockAAVE.json');
const StakedAAVE = require('../artifacts/MockStakedAave.json');
const KyberProxy = require('../artifacts/MockKyberProxy.json');

async function xaaveFixture(provider, [wallet]) {
	const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

	// base erc20s
	const aave = await deployContract(wallet, AAVE);
	const stakedAave = await deployContract(wallet, StakedAAVE, [aave.address]);

	// kyber
	const kyber = await deployContract(wallet, KyberProxy, [ETH_ADDRESS, aave.address])

	// set up state
	await aave.transfer(kyber.address, utils.parseEther('10'))
	await aave.transfer(stakedAave.address, utils.parseEther('10'))
	
	// xAAVE
	const xaave = await deployContract(wallet, xAAVE, [
		aave.address,
		stakedAave.address,
		kyber.address,
		'500',
		'500',
		'100'
	]);
	
	await xaave.approveStakingContract();

	return {
		ETH_ADDRESS,
		aave,
		stakedAave,
		kyber,
		xaave,
	};
}

module.exports = {
	xaaveFixture,
};
