usePlugin('@nomiclabs/buidler-waffle');
usePlugin('@nomiclabs/buidler-etherscan');
usePlugin('buidler-contract-sizer');
require('dotenv').config();

module.exports = {
	networks: {
		ropsten: {
			url: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
			accounts: [`0x${process.env.ROPSTEN_PRIVATE_KEY}`],
			gasPrice: 20000000000,
		},
	},
	test: {
		gas: 8000000,
		blockGasLimit: 8000000,
	},
	solc: {
		version: '0.6.2',
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
