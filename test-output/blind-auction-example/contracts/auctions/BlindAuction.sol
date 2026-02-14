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