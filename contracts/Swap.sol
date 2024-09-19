// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.27;
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Swap {

    error AmountCannotBeZero();
    error OrderAlreadyCompleted();

    // order: 
//address of depositor, token the depositor needs to swap, amout of the token, address of the token depositor wants in return, amount of token they want in return

    struct Order {
        address depositor;
        address tokenToSwap;
        uint256 amountOfTokenRequested;
        address tokenToReturn;
        uint256 amountTokenToReturn;
        bool isCompleted;
    }

    uint256 public noOfOrders;

    mapping (uint256 => Order) public orders;


    event OrderCreated(uint id, address depositor, address _tokenToSwap, uint256 _amountOfTokenRequested, address _tokenToReturn, uint256 _amountTokenToReturn);
    event orderCompleted(uint256 id,address buyer);



    function createOrder(address _tokenToSwap, uint256 _amountOfTokenRequested, address _tokenToReturn, uint256 _amountTokenToReturn) external {
        require(_amountOfTokenRequested > 0,AmountCannotBeZero());
        require(_amountTokenToReturn > 0,AmountCannotBeZero());

        IERC20(_tokenToSwap).transferFrom(msg.sender,address(this),_amountOfTokenRequested);

        orders[noOfOrders] = Order({
            depositor: msg.sender,
            tokenToSwap: _tokenToSwap,
            amountOfTokenRequested: _amountOfTokenRequested,
            tokenToReturn: _tokenToReturn,
            amountTokenToReturn: _amountTokenToReturn,
            isCompleted: false
        });


        emit OrderCreated(noOfOrders,msg.sender,_tokenToSwap,_amountOfTokenRequested,_tokenToReturn,_amountTokenToReturn);
        noOfOrders++;
    }

    function completeOrder(uint256 id) external {
        Order storage order = orders[id];
        require(!order.isCompleted,OrderAlreadyCompleted());

        IERC20.transferFrom(msg.sender,order.depositor,order.amountOfTokenRequested);

        IERC20(order.tokenToSwap).transfer(msg.sender,order.amountOfTokenRequested);

        order.isCompleted = true;

        emit orderCompleted(id,msg.sender);
    }

    




   
}