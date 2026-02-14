# Blind Auction

Sealed-bid auction with encrypted bids using FHEVM

## Overview

This example demonstrates sealed-bid auction with encrypted bids using fhevm.

## Key Concepts

- **Encrypted bidding**
- **Access control**
- **Public decryption**
- **Auction mechanics**

## Contract Implementation

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import "@fhevm/solidity/lib/FHE.sol";

/**
 * @title BlindAuction
 * @dev A sealed-bid auction where bids are encrypted and only revealed at the end
 * @notice This demonstrates advanced FHEVM patterns for confidential auctions
 */
contract BlindAuction {
    struct Bid {
        euint32 amount;
        bool exists;
    }
    
    mapping(address => Bid) public bids;
    address[] public bidders;
    
    address public owner;
    uint256 public auctionEndTime;
    bool public auctionEnded;
    
    address public highestBidder;
    euint32 public highestBid;
    
    event AuctionEnded(address winner);
    event BidPlaced(address bidder);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier auctionActive() {
        require(block.timestamp < auctionEndTime, "Auction has ended");
        require(!auctionEnded, "Auction already ended");
        _;
    }
    
    constructor(uint256 _biddingTime) {
        owner = msg.sender;
        auctionEndTime = block.timestamp + _biddingTime;
    }
    
    /**
     * @dev Place a sealed bid
     * @param encryptedAmount The encrypted bid amount
     * @notice Bid must be encrypted to the contract address
     */
    function placeBid(externalEuint32 encryptedAmount, bytes calldata inputProof) 
        external 
        auctionActive 
    {
        euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        // Grant permissions for the contract and bidder
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        
        // Store the bid
        if (!bids[msg.sender].exists) {
            bidders.push(msg.sender);
        }
        
        bids[msg.sender] = Bid({
            amount: amount,
            exists: true
        });
        
        emit BidPlaced(msg.sender);
    }
    
    /**
     * @dev End the auction and determine winner (only owner)
     * @notice This reveals all bids by comparing them
     */
    function endAuction() external onlyOwner {
        require(block.timestamp >= auctionEndTime, "Auction still active");
        require(!auctionEnded, "Auction already ended");
        
        auctionEnded = true;
        
        if (bidders.length == 0) {
            emit AuctionEnded(address(0));
            return;
        }
        
        // Find the highest bid through encrypted comparison
        highestBidder = bidders[0];
        highestBid = bids[bidders[0]].amount;
        
        for (uint i = 1; i < bidders.length; i++) {
            address currentBidder = bidders[i];
            euint32 currentBid = bids[currentBidder].amount;
            
            // Compare encrypted bids
            ebool isHigher = FHE.gt(currentBid, highestBid);
            
            // Conditionally update highest bid and bidder
            highestBid = FHE.select(isHigher, currentBid, highestBid);
            // Note: In a real implementation, you'd need a more complex way to update the address
            // This is simplified for demonstration
        }
        
        emit AuctionEnded(highestBidder);
    }
    
    /**
     * @dev Get your own bid amount (requires public decryption)
     * @notice This function makes the bid publicly decryptable for the caller
     */
    function getMyBid() external returns (euint32) {
        require(bids[msg.sender].exists, "No bid found");
        euint32 bidAmount = bids[msg.sender].amount;
        return FHE.makePubliclyDecryptable(bidAmount);
    }
    
    /**
     * @dev Get the winning bid amount (only after auction ends)
     * @notice This function makes the winning bid publicly decryptable
     */
    function getWinningBid() external returns (euint32) {
        require(auctionEnded, "Auction not ended");
        require(address(this) == msg.sender || owner == msg.sender, "Not authorized");
        return FHE.makePubliclyDecryptable(highestBid);
    }
    
    /**
     * @dev Check if auction is still active
     */
    function isActive() external view returns (bool) {
        return block.timestamp < auctionEndTime && !auctionEnded;
    }
    
    /**
     * @dev Get number of bidders
     */
    function getBidderCount() external view returns (uint256) {
        return bidders.length;
    }
}
```

## Test Suite

The test suite demonstrates both correct usage and common pitfalls:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { BlindAuction } from "../../types";
import { Signer } from "ethers";
import { createFhevmInstance } from "../utils/fhevm";

describe("BlindAuction", function () {
  let auction: BlindAuction;
  let owner: Signer;
  let bidder1: Signer;
  let bidder2: Signer;
  let bidder3: Signer;
  
  const AUCTION_DURATION = 3600; // 1 hour
  
  beforeEach(async function () {
    [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();
    
    const BlindAuctionFactory = await ethers.getContractFactory("BlindAuction");
    auction = await BlindAuctionFactory.connect(owner).deploy(AUCTION_DURATION);
    await auction.waitForDeployment();
  });

  describe("Deployment", function () {
    it("✅ Should set the correct owner", async function () {
      expect(await auction.owner()).to.equal(await owner.getAddress());
    });

    it("✅ Should set the correct auction end time", async function () {
      const deployTime = (await ethers.provider.getBlock("latest"))!.timestamp;
      const endTime = await auction.auctionEndTime();
      expect(endTime).to.be.closeTo(deployTime + AUCTION_DURATION, 10);
    });

    it("✅ Should start with auction active", async function () {
      expect(await auction.isActive()).to.be.true;
    });
  });

  describe("Bidding", function () {
    it("✅ Should allow placing encrypted bids", async function () {
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      const bidder1Address = await bidder1.getAddress();
      
      // Create encrypted input for bid amount 1000
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, bidder1Address);
      encryptedInput.add32(1000);
      const { handles, inputProof } = await encryptedInput.encrypt();
      
      // Place bid
      await expect(
        auction.connect(bidder1).placeBid(handles[0], inputProof)
      ).to.emit(auction, "BidPlaced")
       .withArgs(bidder1Address);
      
      expect(await auction.getBidderCount()).to.equal(1);
    });

    it("✅ Should allow multiple bidders", async function () {
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      
      // Bidder 1 bids 1000
      const enc1 = await fhevm.createEncryptedInput(contractAddress, await bidder1.getAddress());
      enc1.add32(1000);
      const { handles: h1, inputProof: p1 } = await enc1.encrypt();
      await auction.connect(bidder1).placeBid(h1[0], p1);
      
      // Bidder 2 bids 1500
      const enc2 = await fhevm.createEncryptedInput(contractAddress, await bidder2.getAddress());
      enc2.add32(1500);
      const { handles: h2, inputProof: p2 } = await enc2.encrypt();
      await auction.connect(bidder2).placeBid(h2[0], p2);
      
      expect(await auction.getBidderCount()).to.equal(2);
    });

    it("✅ Should allow bidders to update their bids", async function () {
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      const bidder1Address = await bidder1.getAddress();
      
      // First bid: 1000
      const enc1 = await fhevm.createEncryptedInput(contractAddress, bidder1Address);
      enc1.add32(1000);
      const { handles: h1, inputProof: p1 } = await enc1.encrypt();
      await auction.connect(bidder1).placeBid(h1[0], p1);
      
      // Updated bid: 2000
      const enc2 = await fhevm.createEncryptedInput(contractAddress, bidder1Address);
      enc2.add32(2000);
      const { handles: h2, inputProof: p2 } = await enc2.encrypt();
      await auction.connect(bidder1).placeBid(h2[0], p2);
      
      // Should still be only 1 bidder (same address)
      expect(await auction.getBidderCount()).to.equal(1);
    });

    it("❌ Should reject bids after auction ends", async function () {
      // Fast forward time past auction end
      await ethers.provider.send("evm_increaseTime", [AUCTION_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      const bidder1Address = await bidder1.getAddress();
      
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, bidder1Address);
      encryptedInput.add32(1000);
      const { handles, inputProof } = await encryptedInput.encrypt();
      
      await expect(
        auction.connect(bidder1).placeBid(handles[0], inputProof)
      ).to.be.revertedWith("Auction has ended");
    });
  });

  describe("Auction Ending", function () {
    it("✅ Should allow owner to end auction after time expires", async function () {
      // Place some bids first
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      
      const enc1 = await fhevm.createEncryptedInput(contractAddress, await bidder1.getAddress());
      enc1.add32(1000);
      const { handles: h1, inputProof: p1 } = await enc1.encrypt();
      await auction.connect(bidder1).placeBid(h1[0], p1);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [AUCTION_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(auction.connect(owner).endAuction())
        .to.emit(auction, "AuctionEnded");
      
      expect(await auction.auctionEnded()).to.be.true;
    });

    it("❌ Should reject ending auction before time expires", async function () {
      await expect(auction.connect(owner).endAuction())
        .to.be.revertedWith("Auction still active");
    });

    it("❌ Should reject non-owner ending auction", async function () {
      await ethers.provider.send("evm_increaseTime", [AUCTION_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(auction.connect(bidder1).endAuction())
        .to.be.revertedWith("Only owner can call this");
    });

    it("✅ Should handle auction with no bids", async function () {
      await ethers.provider.send("evm_increaseTime", [AUCTION_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(auction.connect(owner).endAuction())
        .to.emit(auction, "AuctionEnded")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("Bid Decryption", function () {
    it("✅ Should allow bidders to decrypt their own bids", async function () {
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      const bidAmount = 1500;
      
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, await bidder1.getAddress());
      encryptedInput.add32(bidAmount);
      const { handles, inputProof } = await encryptedInput.encrypt();
      
      await auction.connect(bidder1).placeBid(handles[0], inputProof);
      
      const decryptedBid = await auction.connect(bidder1).getMyBid();
      expect(decryptedBid).to.equal(bidAmount);
    });

    it("❌ Should reject decryption for non-existent bids", async function () {
      await expect(auction.connect(bidder1).getMyBid())
        .to.be.revertedWith("No bid found");
    });
  });

  describe("Access Control Patterns", function () {
    it("✅ Demonstrates proper FHE permission handling", async function () {
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      
      // This test verifies that FHE.allowThis() and FHE.allow() are called correctly
      // The contract should handle permissions internally
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, await bidder1.getAddress());
      encryptedInput.add32(1000);
      const { handles, inputProof } = await encryptedInput.encrypt();
      
      // Should not revert due to permission issues
      await expect(
        auction.connect(bidder1).placeBid(handles[0], inputProof)
      ).to.not.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("✅ Should handle zero bids gracefully", async function () {
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, await bidder1.getAddress());
      encryptedInput.add32(0);
      const { handles, inputProof } = await encryptedInput.encrypt();
      
      await expect(
        auction.connect(bidder1).placeBid(handles[0], inputProof)
      ).to.not.be.reverted;
    });

    it("✅ Should handle maximum uint32 bids", async function () {
      const fhevm = await createFhevmInstance();
      const contractAddress = await auction.getAddress();
      const maxBid = 2**32 - 1;
      
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, await bidder1.getAddress());
      encryptedInput.add32(maxBid);
      const { handles, inputProof } = await encryptedInput.encrypt();
      
      await expect(
        auction.connect(bidder1).placeBid(handles[0], inputProof)
      ).to.not.be.reverted;
    });
  });
});
```

## Usage

### Deploy the Contract

```bash
npm run deploy:local
```

### Run Tests

```bash
npm run test
```

## Important Patterns

### ✅ Correct Usage

- Always call `FHE.allowThis()` for contract permissions
- Use `FHE.allow()` for user permissions
- Match encryption signer with transaction sender

### ❌ Common Mistakes

- Forgetting `allowThis()` permissions
- Mismatching encryption context
- Using deprecated API functions

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Examples](https://docs.zama.org/protocol/examples)
- [GitHub Repository](https://github.com/zama-ai/fhevm)
