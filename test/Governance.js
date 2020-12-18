const { expect, assert } = require('chai');
const { utils, ethers } = require('ethers');
const { createFixtureLoader } = require('ethereum-waffle');
const { xaaveFixture } = require('./fixtures');

describe('xAAVE: Governance', async () => {
	const provider = waffle.provider;
	const [wallet, user1, user2] = provider.getWallets();
	const loadFixture = createFixtureLoader(provider, [wallet, user1, user2]);

	let aave;
    let xaave;
    let governanceV2;

	before(async () => {
		({ xaave, aave, governanceV2 } = await loadFixture(xaaveFixture));
	});

	it('should allow the governance v2 address to be set once', async () => {
        await xaave.setGovernanceV2Address(governanceV2.address);
        const proposalId = '1'
        await xaave.voteV2(proposalId, true);

        // test whether address was set properly by seeing if vote executes properly
        const voteDecision = await governanceV2.getVoteByVoter(xaave.address, proposalId)
        expect(voteDecision).to.be.equal(true)
	});

	it('should not allow the governance v2 address to be set again', async () => {
        await xaave.setGovernanceV2Address(aave.address); // incorrect address
        const proposalId = '2'
        await xaave.voteV2(proposalId, true);

        // if vote reads correctly, we know governance address wasn't changed
        const voteDecision = await governanceV2.getVoteByVoter(xaave.address, proposalId)
        expect(voteDecision).to.be.equal(true)
	});
});
