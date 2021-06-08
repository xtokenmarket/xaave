const ADDRESSES = {
	aave: {
		kovan: '0xb597cd8d3217ea6477232f9217fa70837ff667af',
		mainnet: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
	},
	votingAave: {
		kovan: '0x690eAcA024935Aaff9B14b9FF9e9C8757a281f3C',
		mainnet: '0x0671CA7E039af2cF2D2c5e7F1Aa261Ae78B3ffDF',
	},
	stakedAave: {
		kovan: '0xf2fbf9A6710AfDa1c4AaB2E922DE9D69E0C97fd2',
		mainnet: '0x4da27a545c0c5B758a6BA100e3a049001de870f5',
	},
	governance: {
		kovan: '0x374d0940dc9a980219e0aA6566C3067159d2F442',
		mainnet: '0x8a2Efd9A790199F4c94c6effE210fce0B4724f52',
	},
	kyberProxy: {
		kovan: '0x692f391bCc85cefCe8C237C01e1f636BbD70EA4D',
		mainnet: '0x9AAb3f75489902f3a48495025729a0AF77d4b11e',
	},
	proxyAdmin: {
		kovan: '0x803428e38DBFDf2EB25D94B538A1CFc395E66615',
		mainnet: '0x38138586AedB29B436eAB16105b09c317F5a79dd',
	},
	cosigner1: {
		kovan: '0x885583955F14970CbC0046B91297e9915f4DE6E4',
		mainnet: '0x4c19d4c563A701b5A51809369a76e5391C0f4034',
	},
	cosigner2: {
		kovan: '0x5314736b4b7778aC25be9afb3819c4ABF4FBEaEA',
		mainnet: '0xFe072d936072107ef9Ab409cC523B0753EfAbD01',
	},
};

// const network = 'kovan';
const network = 'mainnet';

async function main() {
	const [deployer] = await ethers.getSigners();

	console.log('Deploying contracts with the account:', await deployer.getAddress());

	console.log('Account balance:', (await deployer.getBalance()).toString());

	const xAAVE = await ethers.getContractFactory('xAAVE');
	const xaave = await xAAVE.deploy();

	await xaave.deployed();
	console.log('xaave.address', xaave.address);

	const xAAVEProxy = await ethers.getContractFactory('xAAVEProxy');
	const xaaveProxy = await xAAVEProxy.deploy(
		xaave.address,
		ADDRESSES['proxyAdmin'][network],
		ADDRESSES['cosigner1'][network],
		ADDRESSES['cosigner2'][network]
	);
	await xaaveProxy.deployed();
	console.log('xaaveProxy', xaaveProxy.address);

	const xaaveProxyCast = await ethers.getContractAt('xAAVE', xaaveProxy.address, deployer);

	await xaaveProxyCast.initialize(
		ADDRESSES['aave'][network],
		ADDRESSES['votingAave'][network],
		ADDRESSES['stakedAave'][network],
		ADDRESSES['governance'][network],
		ADDRESSES['kyberProxy'][network],
		'500',
		'500',
		'100',
		'xAAVEa',
		'Buchanan'
	);
	console.log('initialized')
	
	await xaaveProxyCast.approveStakingContract();
	console.log('staking contract approved')
	await xaaveProxyCast.approveKyberContract(ADDRESSES['aave'][network]);
	console.log('kyber contract approved')
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = {
	ADDRESSES,
};
