pragma solidity >=0.6.0;

contract MockGovernanceV2 {
    mapping(address => mapping(uint => bool)) voteByVoter;

    function submitVote(uint256 proposalId, bool support) external {
        voteByVoter[msg.sender][proposalId] = support;
    }

    function getVoteByVoter(address voter, uint proposalId) public view returns(bool){
        return voteByVoter[voter][proposalId];
    }
}