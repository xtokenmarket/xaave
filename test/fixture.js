const { ethers } = require('hardhat');
const { utils } = ethers;
const { deploy, deployArgs } = require('./helpers');

const deploymentFixture = deployments.createFixture(async () => {
	const [wallet, cosigner1, cosigner2] = await ethers.getSigners();
	const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

	// base erc20s
	const aave = await deploy('MockAave');
	const stakedAave = await deployArgs('MockStakedAave', aave.address);

	// kyber
	const kyber = await deployArgs('MockKyberProxy', ETH_ADDRESS, aave.address);

	// set up state
	await aave.transfer(kyber.address, utils.parseEther('500'));
	await aave.transfer(stakedAave.address, utils.parseEther('10'));

	// governance
	const governanceV2 = await deploy('MockGovernanceV2')

	// xAAVE
	const votingAave = await deploy('MockVotingAave')
	const governance = await deploy('MockProtoGovernance');
	const xaave = await deploy('xAAVE');

	let xaaveProxy = await deployArgs('xAAVEProxy',
		xaave.address,
		wallet.address,
		cosigner1.address,
		cosigner2.address,
	);

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
});

module.exports = { deploymentFixture };
