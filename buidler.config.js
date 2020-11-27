usePlugin('@nomiclabs/buidler-waffle');
usePlugin('@nomiclabs/buidler-etherscan');
usePlugin('buidler-contract-sizer');
usePlugin("@nomiclabs/buidler-ethers");
require('dotenv').config();

module.exports = {
	networks: {
		kovan: {
			url: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
			accounts: [`0x${process.env.KOVAN_PRIVATE_KEY}`],
			gasPrice: 20000000000,
		},
		mainnet: {
			url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
			accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
			gasPrice: 50000000000,
			// 25000000000 == 25 gwei
		},
	},
	test: {
		gas: 8000000,
		blockGasLimit: 8000000,
	},
	solc: {
		version: "0.6.2",
		optimizer: {
			enabled: true,
			runs: 200
		  }
	},
	mocha: {
		timeout: 50000,
	},
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: `${process.env.ETHERSCAN_API_KEY}`,
	},
	// yarn run buidler size-contracts
	contractSizer: {
		alphaSort: true,
		runOnCompile: true,
	},
};
