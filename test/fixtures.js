const { Contract, utils } = require('ethers');
const { ethers } = require('@nomiclabs/buidler');
const { deployContract } = require('ethereum-waffle');

const xAAVE = require('../artifacts/xAAVE.json');
const xAAVEProxy = require('../artifacts/xAAVEProxy.json');
const AAVE = require('../artifacts/MockAAVE.json');
const ProtoGovernance = require('../artifacts/MockProtoGovernance.json');
const GovernanceV2 = require('../artifacts/MockGovernanceV2.json');
const VotingAAVE = require('../artifacts/MockVotingAave.json');
const StakedAAVE = require('../artifacts/MockStakedAave.json');
const KyberProxy = require('../artifacts/MockKyberProxy.json');

async function xaaveFixture(provider, [wallet, cosigner1, cosigner2]) {
	const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

	// base erc20s
	const aave = await deployContract(wallet, AAVE);
	const stakedAave = await deployContract(wallet, StakedAAVE, [aave.address]);

	// kyber
	const kyber = await deployContract(wallet, KyberProxy, [ETH_ADDRESS, aave.address]);

	// set up state
	await aave.transfer(kyber.address, utils.parseEther('500'));
	await aave.transfer(stakedAave.address, utils.parseEther('10'));

	// governance
	const governanceV2 = await deployContract(wallet, GovernanceV2)

	// xAAVE
	const votingAave = await deployContract(wallet, VotingAAVE)
	const governance = await deployContract(wallet, ProtoGovernance);
	const xaave = await deployContract(wallet, xAAVE);

	let xaaveProxy = await deployContract(wallet, xAAVEProxy, [
		xaave.address,
		wallet.address,
		cosigner1.address,
		cosigner2.address,
	]);

	const xaaveProxyCast = await ethers.getContractAt('xAAVE', xaaveProxy.address, wallet);
	await xaaveProxyCast.initialize(
		aave.address,
		votingAave.address,
		stakedAave.address,
		governance.address,
		kyber.address,
		'500',
		'500',
		'100',
		'xAAVEa',
		'Samuelson'
	);

	await xaaveProxyCast.approveStakingContract();
	await xaaveProxyCast.approveKyberContract(aave.address);

	return {
		ETH_ADDRESS,
		aave,
		stakedAave,
		kyber,
		xaave: xaaveProxyCast,
		xaaveProxy,
		implementation: xaave.address,
		governanceV2
	};
}

module.exports = {
	xaaveFixture,
};
