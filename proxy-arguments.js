const { ADDRESSES } = require('./scripts/deploy')
const network = 'kovan'
module.exports = [
    '0x1473157DF46708F17bdA18C306AabE90Af41a0a1',
    ADDRESSES['proxyAdmin'][network],
    ADDRESSES['cosigner1'][network], 
    ADDRESSES['cosigner2'][network] 
]
//                                                    <deployed-contract-address>  
// npx buidler verify --constructor-args arguments.js 0xb56e2c6868118A970Bb94891C7A8D7D75eEBc0a7 --network ropsten