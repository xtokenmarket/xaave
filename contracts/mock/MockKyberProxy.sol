pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockKyberProxy {
    address ethAddress;
    address aaveAddress;

    constructor(address _ethAddress, address _aaveAddress) public {
        ethAddress = _ethAddress;
        aaveAddress = _aaveAddress;
    }

    uint ethAave = 6; // eth $300, aave $50

    function swapEtherToToken(ERC20 token, uint minConversionRate) external payable returns(uint amountToSend) {
        if(token == ERC20(aaveAddress)){
            amountToSend = msg.value * ethAave;
            IERC20(aaveAddress).transfer(msg.sender, amountToSend);
        }
    }
    function swapTokenToEther(ERC20 token, uint tokenQty, uint minRate) external payable returns(uint) {
        if(token == ERC20(aaveAddress)){
            IERC20(aaveAddress).transferFrom(msg.sender, address(this), tokenQty);
            msg.sender.transfer(tokenQty/ ethAave);
        }
    }

    function swapTokenToToken(ERC20 src, uint srcAmount, ERC20 dest, uint minConversionRate) public returns(uint){
        // if(src == ERC20(wethAddress) && dest == ERC20(susdAddress)){
        //     IERC20(wethAddress).transferFrom(msg.sender, address(this), srcAmount);
        //     IERC20(susdAddress).transfer(msg.sender, srcAmount.mul(ethUsd));
        // }
    }

    receive() external payable {

    }
}