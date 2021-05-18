const buidler = require('@nomiclabs/buidler');

async function increaseTime(time) {
	let provider = buidler.ethers.provider;
	await provider.send('evm_increaseTime', [time]);
	await provider.send('evm_mine', []);
}

/**
 * Mine several blocks in network
 * @param {Number} blockCount how many blocks to mine
 */
 async function mineBlocks(blockCount) {
	let provider = buidler.ethers.provider;
    for(let i = 0 ; i < blockCount ; ++i) {
        await provider.send("evm_mine");
    }
}

module.exports = {
    increaseTime, mineBlocks
}