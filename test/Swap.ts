import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Swap", function () {
  async function deploySwapFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const tokenA = await hre.ethers.getContractFactory("MockERC20");
    const tokenB = await hre.ethers.getContractFactory("MockERC20");

    const tokenToSwap = await tokenA.deploy("TokenA", "TKA", 18, 1000000);
    const tokenToReturn = await tokenB.deploy("TokenB", "TKB", 18, 1000000);


    const Swap = await hre.ethers.getContractFactory("Swap");
    const swap = await Swap.deploy();

    const amountToSwap = hre.ethers.parseUnits("100", 18);
    const amountToReturn = hre.ethers.parseUnits("20", 18);

   
    await tokenToSwap.mint(owner.address, amountToSwap);
    await tokenToReturn.mint(otherAccount.address, amountToReturn);

    return { swap, tokenToSwap, tokenToReturn, owner, otherAccount, amountToSwap, amountToReturn };
  }

  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { swap } = await loadFixture(deploySwapFixture);

      expect(await swap.noOfOrders()).to.equal(0);
    });
  });

  describe("Create Order", function () {
    it("Should create an order correctly", async function () {
      const { swap, tokenToSwap, tokenToReturn, owner, amountToSwap, amountToReturn } = await loadFixture(deploySwapFixture);

      await tokenToSwap.approve(swap.address, amountToSwap);

      await expect(swap.createOrder(tokenToSwap.address, amountToSwap, tokenToReturn.address, amountToReturn))
        .to.emit(swap, "OrderCreated")
        .withArgs(0, owner.address, tokenToSwap.address, amountToSwap, tokenToReturn.address, amountToReturn);

      expect(await swap.noOfOrders()).to.equal(1);
    });

    it("Should revert if amounts are zero", async function () {
      const { swap, tokenToSwap, tokenToReturn } = await loadFixture(deploySwapFixture);

      await expect(swap.createOrder(tokenToSwap.address, 0, tokenToReturn.address, 0))
        .to.be.revertedWith("AmountCannotBeZero");
    });
  });

  describe("Complete Order", function () {
    it("Should complete the order and transfer tokens", async function () {
      const { swap, tokenToSwap, tokenToReturn, owner, otherAccount, amountToSwap, amountToReturn } = await loadFixture(deploySwapFixture);

      
      await tokenToSwap.approve(swap.address, amountToSwap);
      await swap.createOrder(tokenToSwap.address, amountToSwap, tokenToReturn.address, amountToReturn);

      
      await tokenToReturn.connect(otherAccount).approve(swap.address, amountToReturn);

      
      await expect(swap.connect(otherAccount).completeOrder(0))
        .to.emit(swap, "orderCompleted")
        .withArgs(0, otherAccount.address);

     
      expect(await tokenToReturn.balanceOf(owner.address)).to.equal(amountToReturn);
      expect(await tokenToSwap.balanceOf(otherAccount.address)).to.equal(amountToSwap);
    });

    it("Should revert if the order is already completed", async function () {
      const { swap, tokenToSwap, tokenToReturn, otherAccount, amountToSwap, amountToReturn } = await loadFixture(deploySwapFixture);

      await tokenToSwap.approve(swap.address, amountToSwap);
      await swap.createOrder(tokenToSwap.address, amountToSwap, tokenToReturn.address, amountToReturn);

      await tokenToReturn.connect(otherAccount).approve(swap.address, amountToReturn);

      await swap.connect(otherAccount).completeOrder(0);

      await expect(swap.connect(otherAccount).completeOrder(0))
        .to.be.revertedWith("OrderAlreadyCompleted");
    });
  });

  describe("Get All Orders", function () {
    it("Should return all orders", async function () {
      const { swap, tokenToSwap, tokenToReturn, amountToSwap, amountToReturn } = await loadFixture(deploySwapFixture);

      await tokenToSwap.approve(swap.address, amountToSwap);
      await swap.createOrder(tokenToSwap.address, amountToSwap, tokenToReturn.address, amountToReturn);

      const orders = await swap.getAllOrders();
      expect(orders.length).to.equal(1);
      expect(orders[0].depositor).to.equal((await hre.ethers.getSigners())[0].address);
    });
  });
});
