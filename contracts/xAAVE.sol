pragma solidity >=0.6.0;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interface/IKyberNetworkProxy.sol";
import "./interface/IStakedAave.sol";

// stake tx
// https://etherscan.io/tx/0xa82a152968c3b74d68325638e89ad5a5a8849534de880dab9430429185563337
// staked aave address: 0x4da27a545c0c5B758a6BA100e3a049001de870f5
contract xAAVE is ERC20, Ownable {
    using SafeMath for uint256;

    uint256 constant DEC_18 = 1e18;
    uint256 constant MAX_UINT = 2**256 - 1;
    uint256 constant AAVE_BUFFER_TARGET = 20; // 5% target
    uint256 constant INITIAL_SUPPLY_MULTIPLIER = 10;

    uint256 public withdrawableAaveFees;

    address constant ZERO_ADDRESS = address(0);
    address
        private constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address private manager;

    IERC20 private aave;
    IStakedAave private stakedAave;

    IKyberNetworkProxy kyberProxy;

    struct FeeDivisors {
        uint256 mintFee;
        uint256 burnFee;
        uint256 claimFee;
    }

    FeeDivisors public feeDivisors;

    // change to initialize when proxy added
    constructor(
        IERC20 _aave,
        IStakedAave _stakedAave,
        IKyberNetworkProxy _kyberProxy,
        uint256 _mintFeeDivisor,
        uint256 _burnFeeDivisor,
        uint256 _claimFeeDivisor
    ) public ERC20("xAAVE", "xAAVEa") {
        aave = _aave;
        stakedAave = _stakedAave;
        kyberProxy = _kyberProxy;

        _setFeeDivisors(_mintFeeDivisor, _burnFeeDivisor, _claimFeeDivisor);
    }

    /* ========================================================================================= */
    /*                                        Investor-Facing                                    */
    /* ========================================================================================= */

    /*
     * @dev Mint xAAVE using ETH
     * @param minRate: Kyber min rate
     */
    function mint(uint256 minRate) external payable {
        require(msg.value > 0, "Must send ETH");

        (uint256 stakedBalance, uint256 bufferBalance) = getFundBalances();
        uint256 aaveHoldings = bufferBalance.add(stakedBalance);

        uint256 fee = _calculateFee(msg.value, feeDivisors.mintFee);

        uint256 incrementalAave = kyberProxy.swapEtherToToken.value(
            msg.value.sub(fee)
        )(ERC20(address(aave)), minRate);

        uint256 allocationToStake = _calculateAllocationToStake(
            bufferBalance,
            incrementalAave,
            stakedBalance
        );
        uint256 mintAmount = calculateMintAmount(incrementalAave, aaveHoldings);

        _stake(allocationToStake);
        return super._mint(msg.sender, mintAmount);
    }

    /*
     * @dev Mint xAAVE using AAVE
     * @notice Must run approval first
     * @param aaveAmount: AAVE to contribute
     */
    function mintWithToken(uint256 aaveAmount) public {
        require(aaveAmount > 0, "Must send AAVE");

        (uint256 stakedBalance, uint256 bufferBalance) = getFundBalances();
        uint256 aaveHoldings = bufferBalance.add(stakedBalance);

        aave.transferFrom(msg.sender, address(this), aaveAmount);

        uint256 fee = _calculateFee(aaveAmount, feeDivisors.mintFee);
        _incrementWithdrawableAaveFees(fee);

        uint256 incrementalAave = aaveAmount.sub(fee);
        uint256 allocationToStake = _calculateAllocationToStake(
            bufferBalance,
            incrementalAave,
            stakedBalance
        );
        _stake(allocationToStake);

        uint256 mintAmount = calculateMintAmount(incrementalAave, aaveHoldings);
        return super._mint(msg.sender, mintAmount);
    }

    /*
     * @dev Burn xAAVE tokens
     * @notice Will fail if redemption value exceeds available liquidity
     * @param redeemAmount: xAAVE to redeem
     */
    function burn(uint256 redeemAmount) public {
        require(redeemAmount > 0, "Must send xAAVE");

        (uint256 stakedBalance, uint256 bufferBalance) = getFundBalances();
        uint256 aaveHoldings = bufferBalance.add(stakedBalance);
        uint256 proRataAave = aaveHoldings.mul(redeemAmount).div(totalSupply());

        require(proRataAave <= bufferBalance, "Insufficient exit liquidity");

        uint256 fee = _calculateFee(proRataAave, feeDivisors.burnFee);
        _incrementWithdrawableAaveFees(fee);

        super._burn(msg.sender, redeemAmount);
        aave.transfer(msg.sender, proRataAave.sub(fee));
    }

    /* ========================================================================================= */
    /*                                             NAV                                           */
    /* ========================================================================================= */

    function getFundHoldings() public view returns (uint256) {
        return getStakedBalance().add(getBufferBalance());
    }

    function getStakedBalance() public view returns (uint256) {
        return IERC20(address(stakedAave)).balanceOf(address(this));
    }

    function getBufferBalance() public view returns (uint256) {
        return aave.balanceOf(address(this)).sub(withdrawableAaveFees);
    }

    function getFundBalances() public view returns (uint256, uint256) {
        return (getStakedBalance(), getBufferBalance());
    }

    function calculateMintAmount(
        uint256 incrementalAave,
        uint256 aaveHoldingsBefore
    ) public view returns (uint256 mintAmount) {
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0)
            return incrementalAave.mul(INITIAL_SUPPLY_MULTIPLIER);

        mintAmount = (incrementalAave).mul(totalSupply).div(aaveHoldingsBefore);
    }

    /* ========================================================================================= */
    /*                                       Fund Management                                     */
    /* ========================================================================================= */

    function _stake(uint256 _amount) private {
        if (_amount > 0) {
            stakedAave.stake(address(this), _amount);
        }
    }

    function cooldown() public onlyOwnerOrManager {
        stakedAave.cooldown();
    }

    function redeem(uint256 amount) public onlyOwnerOrManager {
        stakedAave.redeem(address(this), amount);
    }

    // todo: claim fees, not just staking rewards
    function claim() public onlyOwnerOrManager {
        uint256 bufferBalanceBefore = getBufferBalance();

        stakedAave.claimRewards(address(this), MAX_UINT);

        uint256 bufferBalanceAfter = getBufferBalance();
        uint256 claimed = bufferBalanceAfter.sub(bufferBalanceBefore);

        uint256 fee = _calculateFee(claimed, feeDivisors.claimFee);
        _incrementWithdrawableAaveFees(fee);
    }

    function _calculateAllocationToStake(
        uint256 bufferBalanceBefore,
        uint256 incrementalAave,
        uint256 stakedBalance
    ) internal view returns (uint256 stakeAmount) {
        uint256 bufferBalanceAfter = bufferBalanceBefore.add(incrementalAave);
        uint256 aaveHoldings = bufferBalanceAfter.add(stakedBalance);

        uint256 targetBufferBalance = (aaveHoldings.add(bufferBalanceAfter))
            .div(AAVE_BUFFER_TARGET);

        // allocate full incremental aave to buffer balance
        if (bufferBalanceAfter < targetBufferBalance) return 0;

        // allocate full incremental aave to stake
        if (bufferBalanceBefore > targetBufferBalance)
            return bufferBalanceAfter.sub(bufferBalanceBefore);

        // partial allocation to buffer and partial to stake
        stakeAmount = bufferBalanceAfter.sub(targetBufferBalance);
    }

    function _calculateFee(uint256 _value, uint256 _feeDivisor)
        internal
        pure
        returns (uint256 fee)
    {
        if (_feeDivisor > 0) {
            fee = _value.div(_feeDivisor);
        }
    }

    function _incrementWithdrawableAaveFees(uint256 feeAmount) private {
        withdrawableAaveFees = withdrawableAaveFees.add(feeAmount);
    }

    /*
     * @notice Inverse of fee i.e., a fee divisor of 100 == 1%
     * @notice Three fee types
     * @dev Mint fee 0 or <= 2%
     * @dev Burn fee 0 or <= 1%
     * @dev Claim fee 0 <= 4%
     */
    function setFeeDivisors(
        uint256 mintFeeDivisor,
        uint256 burnFeeDivisor,
        uint256 claimFeeDivisor
    ) public onlyOwner {
        _setFeeDivisors(mintFeeDivisor, burnFeeDivisor, claimFeeDivisor);
    }

    function _setFeeDivisors(
        uint256 _mintFeeDivisor,
        uint256 _burnFeeDivisor,
        uint256 _claimFeeDivisor
    ) private {
        require(_mintFeeDivisor == 0 || _mintFeeDivisor >= 50, "Invalid fee");
        require(_burnFeeDivisor == 0 || _burnFeeDivisor >= 100, "Invalid fee");
        require(_claimFeeDivisor >= 25, "Invalid fee");
        feeDivisors.mintFee = _mintFeeDivisor;
        feeDivisors.burnFee = _burnFeeDivisor;
        feeDivisors.claimFee = _claimFeeDivisor;
    }

    /* ========================================================================================= */
    /*                                           Utils                                           */
    /* ========================================================================================= */

    function approveStakingContract() public onlyOwner {
        aave.approve(address(stakedAave), MAX_UINT);
    }

    function setManager(address _manager) public onlyOwner {
        manager = _manager;
    }

    modifier onlyOwnerOrManager {
        require(
            msg.sender == owner() || msg.sender == manager,
            "Non-admin caller"
        );
        _;
    }

    function withdrawFees() public onlyOwner {
        (bool success, ) = msg.sender.call.value(address(this).balance)("");
        require(success, "Transfer failed");

        uint256 aaveFees = withdrawableAaveFees;
        withdrawableAaveFees = 0;
        aave.transfer(msg.sender, aaveFees);
    }
}
