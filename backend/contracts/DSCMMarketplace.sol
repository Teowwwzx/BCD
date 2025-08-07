// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DSCMMarketplace is ReentrancyGuard, Ownable, Pausable, AccessControl {
    uint256 private _listingIds;
    uint256 private _orderIds;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    // Security constants
    uint256 public constant MAX_LISTING_PRICE = 1000 ether;
    uint256 public constant MIN_LISTING_PRICE = 0.001 ether;
    uint256 public constant MAX_QUANTITY = 10000;
    
    // Fee structure
    uint256 public platformFeePercentage = 250; // 2.5% (basis points)
    address public feeRecipient;
    
    // Security mappings
    mapping(address => bool) public blacklistedUsers;
    mapping(uint256 => uint256) public listingCreationTime;
    
    // Listing status enum
    enum ListingStatus { Active, Sold, Cancelled }
    
    // Order status enum
    enum OrderStatus { AwaitingPayment, AwaitingShipment, InTransit, Delivered, Completed, Disputed, Cancelled }
    
    // Product listing structure
    struct Listing {
        uint256 listingId;
        address seller;
        string name;
        string description;
        string category;
        uint256 price;
        uint256 quantity;
        string location;
        string imageUrl;
        ListingStatus status;
        uint256 createdAt;
    }
    
    // Order structure
    struct Order {
        uint256 orderId;
        uint256 listingId;
        address buyer;
        address seller;
        address transporter;
        uint256 finalPrice;
        uint256 quantityPurchased;
        OrderStatus status;
        uint256 createdAt;
        uint256 escrowAmount;
        bool buyerConfirmed;
        bool sellerConfirmed;
    }
    
    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256) public userReputation;
    
    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        string name,
        uint256 price,
        uint256 quantity
    );
    
    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 finalPrice,
        uint256 quantity
    );
    
    event OrderStatusUpdated(
        uint256 indexed orderId,
        OrderStatus newStatus
    );
    
    event PaymentReleased(
        uint256 indexed orderId,
        address indexed seller,
        uint256 amount
    );
    
    event TransporterAssigned(
        uint256 indexed orderId,
        address indexed transporter
    );
    
    event DisputeRaised(
        uint256 indexed orderId,
        address indexed initiator
    );
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        feeRecipient = _feeRecipient;
    }
    
    // Create a new product listing
    function createListing(
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _price,
        uint256 _quantity,
        string memory _location,
        string memory _imageUrl
    ) external whenNotPaused {
        require(!blacklistedUsers[msg.sender], "User is blacklisted");
        require(_price >= MIN_LISTING_PRICE && _price <= MAX_LISTING_PRICE, "Price out of allowed range");
        require(_quantity > 0 && _quantity <= MAX_QUANTITY, "Invalid quantity");
        require(bytes(_name).length > 0 && bytes(_name).length <= 100, "Invalid name length");
        require(bytes(_description).length <= 1000, "Description too long");
        require(bytes(_category).length > 0 && bytes(_category).length <= 50, "Invalid category");
        
        _listingIds++;
        uint256 newListingId = _listingIds;
        
        listings[newListingId] = Listing({
            listingId: newListingId,
            seller: msg.sender,
            name: _name,
            description: _description,
            category: _category,
            price: _price,
            quantity: _quantity,
            location: _location,
            imageUrl: _imageUrl,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });
        
        userListings[msg.sender].push(newListingId);
        listingCreationTime[newListingId] = block.timestamp;
        
        emit ListingCreated(newListingId, msg.sender, _name, _price, _quantity);
    }
    
    // Purchase a product (creates order with escrow)
    function purchaseProduct(
        uint256 _listingId,
        uint256 _quantity
    ) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        
        require(!blacklistedUsers[msg.sender], "User is blacklisted");
        require(!blacklistedUsers[listing.seller], "Seller is blacklisted");
        require(listing.listingId != 0, "Listing does not exist");
        require(listing.status == ListingStatus.Active, "Listing is not active");
        require(listing.seller != msg.sender, "Cannot buy your own product");
        require(_quantity > 0 && _quantity <= listing.quantity, "Invalid quantity");
        
        uint256 totalPrice = listing.price * _quantity;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeePercentage) / 10000;
        uint256 sellerAmount = totalPrice - platformFee;
        
        _orderIds++;
        uint256 newOrderId = _orderIds;
        
        orders[newOrderId] = Order({
            orderId: newOrderId,
            listingId: _listingId,
            buyer: msg.sender,
            seller: listing.seller,
            transporter: address(0),
            finalPrice: totalPrice,
            quantityPurchased: _quantity,
            status: OrderStatus.AwaitingShipment,
            createdAt: block.timestamp,
            escrowAmount: sellerAmount,
            buyerConfirmed: false,
            sellerConfirmed: false
        });
        
        // Update listing quantity
        listing.quantity -= _quantity;
        if (listing.quantity == 0) {
            listing.status = ListingStatus.Sold;
        }
        
        userOrders[msg.sender].push(newOrderId);
        userOrders[listing.seller].push(newOrderId);
        
        // Transfer platform fee immediately
        if (platformFee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
        }
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit OrderCreated(newOrderId, _listingId, msg.sender, listing.seller, totalPrice, _quantity);
    }
    
    // Assign transporter to order
    function assignTransporter(uint256 _orderId, address _transporter) external {
        Order storage order = orders[_orderId];
        
        require(order.orderId != 0, "Order does not exist");
        require(msg.sender == order.seller, "Only seller can assign transporter");
        require(order.status == OrderStatus.AwaitingShipment, "Invalid order status");
        require(_transporter != address(0), "Invalid transporter address");
        
        order.transporter = _transporter;
        order.status = OrderStatus.InTransit;
        
        userOrders[_transporter].push(_orderId);
        
        emit TransporterAssigned(_orderId, _transporter);
        emit OrderStatusUpdated(_orderId, OrderStatus.InTransit);
    }
    
    // Update order status
    function updateOrderStatus(uint256 _orderId, OrderStatus _newStatus) external {
        Order storage order = orders[_orderId];
        
        require(order.orderId != 0, "Order does not exist");
        require(
            msg.sender == order.seller || 
            msg.sender == order.buyer || 
            msg.sender == order.transporter,
            "Not authorized to update order"
        );
        
        // Status transition validation
        if (_newStatus == OrderStatus.Delivered) {
            require(
                msg.sender == order.transporter || msg.sender == order.buyer,
                "Only transporter or buyer can mark as delivered"
            );
            require(order.status == OrderStatus.InTransit, "Order must be in transit");
        }
        
        order.status = _newStatus;
        
        emit OrderStatusUpdated(_orderId, _newStatus);
    }
    
    // Confirm delivery (buyer confirms receipt)
    function confirmDelivery(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        
        require(order.orderId != 0, "Order does not exist");
        require(msg.sender == order.buyer, "Only buyer can confirm delivery");
        require(order.status == OrderStatus.Delivered, "Order must be delivered first");
        
        order.buyerConfirmed = true;
        
        // If both parties confirmed, release payment
        if (order.buyerConfirmed && order.sellerConfirmed) {
            _releasePayment(_orderId);
        }
    }
    
    // Seller confirms completion
    function confirmCompletion(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        
        require(order.orderId != 0, "Order does not exist");
        require(msg.sender == order.seller, "Only seller can confirm completion");
        require(order.status == OrderStatus.Delivered, "Order must be delivered first");
        
        order.sellerConfirmed = true;
        
        // If both parties confirmed, release payment
        if (order.buyerConfirmed && order.sellerConfirmed) {
            _releasePayment(_orderId);
        }
    }
    
    // Internal function to release payment from escrow
    function _releasePayment(uint256 _orderId) internal {
        Order storage order = orders[_orderId];
        
        require(order.escrowAmount > 0, "No funds in escrow");
        
        uint256 amount = order.escrowAmount;
        order.escrowAmount = 0;
        order.status = OrderStatus.Completed;
        
        // Update reputation
        userReputation[order.seller] += 1;
        userReputation[order.buyer] += 1;
        
        // Transfer payment to seller
        (bool success, ) = payable(order.seller).call{value: amount}("");
        require(success, "Payment transfer failed");
        
        emit PaymentReleased(_orderId, order.seller, amount);
        emit OrderStatusUpdated(_orderId, OrderStatus.Completed);
    }
    
    // Raise dispute
    function raiseDispute(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        
        require(order.orderId != 0, "Order does not exist");
        require(
            msg.sender == order.buyer || msg.sender == order.seller,
            "Only buyer or seller can raise dispute"
        );
        require(
            order.status != OrderStatus.Completed && 
            order.status != OrderStatus.Cancelled &&
            order.status != OrderStatus.Disputed,
            "Cannot dispute this order"
        );
        
        order.status = OrderStatus.Disputed;
        
        emit DisputeRaised(_orderId, msg.sender);
        emit OrderStatusUpdated(_orderId, OrderStatus.Disputed);
    }
    
    // Get listing details
    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }
    
    // Get order details
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
    
    // Get user's listings
    function getUserListings(address _user) external view returns (uint256[] memory) {
        return userListings[_user];
    }
    
    // Get user's orders
    function getUserOrders(address _user) external view returns (uint256[] memory) {
        return userOrders[_user];
    }

    function listingsCount() external view returns (uint256) {
        return _listingIds;
    }
    
    // Get total listings count
    function getTotalListings() external view returns (uint256) {
        return _listingIds;
    }
    
    // Get total orders count
    function getTotalOrders() external view returns (uint256) {
        return _orderIds;
    }
    
    // Get user reputation
    function getUserReputation(address _user) external view returns (uint256) {
        return userReputation[_user];
    }
    
    // Security and admin functions
    function pauseContract() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpauseContract() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function blacklistUser(address _user) external onlyRole(ADMIN_ROLE) {
        blacklistedUsers[_user] = true;
    }
    
    function removeFromBlacklist(address _user) external onlyRole(ADMIN_ROLE) {
        blacklistedUsers[_user] = false;
    }
    
    function setPlatformFee(uint256 _feePercentage) external onlyRole(ADMIN_ROLE) {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFeePercentage = _feePercentage;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyRole(ADMIN_ROLE) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    function cancelListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.listingId != 0, "Listing does not exist");
        require(msg.sender == listing.seller || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(listing.status == ListingStatus.Active, "Listing not active");
        
        listing.status = ListingStatus.Cancelled;
    }
    
    // Emergency functions (only owner)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Override required by Solidity for multiple inheritance
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Resolve dispute (only owner)
    function resolveDispute(
        uint256 _orderId, 
        bool _refundBuyer
    ) external onlyOwner {
        Order storage order = orders[_orderId];
        
        require(order.orderId != 0, "Order does not exist");
        require(order.status == OrderStatus.Disputed, "Order is not disputed");
        require(order.escrowAmount > 0, "No funds in escrow");
        
        uint256 amount = order.escrowAmount;
        order.escrowAmount = 0;
        
        if (_refundBuyer) {
            order.status = OrderStatus.Cancelled;
            (bool success, ) = payable(order.buyer).call{value: amount}("");
            require(success, "Refund failed");
        } else {
            order.status = OrderStatus.Completed;
            userReputation[order.seller] += 1;
            (bool success, ) = payable(order.seller).call{value: amount}("");
            require(success, "Payment failed");
        }
        
        emit OrderStatusUpdated(_orderId, order.status);
    }
}