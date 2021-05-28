require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('hardhat-contract-sizer');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config()

const config = {
	solidity: {
		version: '0.6.2',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		hardhat: {
			forking: {
				url: process.env.ALCHEMY_URL,
				enabled: false
			}
		},
		mainnet: {
		  url: process.env.ALCHEMY_URL,
		  accounts: [process.env.ADMIN_PRIVATE_KEY],
		  gasPrice: 100000000000
		}
	},
	contractSizer: {
		alphaSort: true,
		runOnCompile: true,
	},
	etherscan: {
	  apiKey: process.env.ETHERSCAN_API_KEY
	}
};

module.exports = config;
