const { ADDRESSES } = require('./scripts/deploy')
const network = 'mainnet'
// const network = 'kovan'

module.exports = [
    '0xD25363E55F0D7fbeCDe932A0b506e42A4A291C37',
    ADDRESSES['proxyAdmin'][network],
    ADDRESSES['cosigner1'][network], 
    ADDRESSES['cosigner2'][network] 
]
//                                                    <deployed-contract-address>  
// npx buidler verify --constructor-args arguments.js 0xb56e2c6868118A970Bb94891C7A8D7D75eEBc0a7 --network ropsten