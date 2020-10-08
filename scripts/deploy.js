// // ROPSTEN
// const BNT_ADDRESS = '0x98474564A00d15989F16BFB7c162c782b0e2b336'
// const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
// // const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000

// const LINK_ADDRESS = '0x20fe562d797a42dcb3399062ae9546cd06f63280'
// const LINK_V2_CONVERTER_ADDRESS = '0xa366Ca2095b3210F4c7096B80Fee553c36294128'

// const BAT_ADDRESS = '0x443fd8d5766169416ae42b8e050fe9422f628419'
// const BAT_V2_CONVERTER_ADDRESS = '0x25d67b9c63C5e043570BdEa62f747021905fb501'

// const WBTC_ADDRESS = '0xbde8bb00a7ef67007a96945b3a3621177b615c44'
// const WBTC_V2_CONVERTER_ADDRESS = '0x8cEeF24Ac562a0eD777073Ae3bF0b1311B2E9C1f'

// const BANCOR_NETWORK_ADDRESS = '0xbe76bC6d0fC627EDE9B4B96A674AE6655919803f'
// const BANCOR_CONTRACT_REGISTRY = '0xA6DB4B0963C37Bc959CbC0a874B5bDDf2250f26F';

// async function main() {
//   const [deployer] = await ethers.getSigners()

//   console.log(
//     'Deploying contracts with the account:',
//     await deployer.getAddress(),
//   )

//   console.log('Account balance:', (await deployer.getBalance()).toString())

//   const xBNT = await ethers.getContractFactory('xBNT')
//   const xbnt = await xBNT.deploy(
//     BNT_ADDRESS,
//     [LINK_V2_CONVERTER_ADDRESS, BAT_V2_CONVERTER_ADDRESS, WBTC_V2_CONVERTER_ADDRESS],
//     BANCOR_CONTRACT_REGISTRY
//   );

//   await xbnt.deployed();
//   console.log('xBNT address:', xbnt.address)
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error)
//     process.exit(1)
//   })
