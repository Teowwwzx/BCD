// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DSCMMarketplace is ReentrancyGuard, Ownable {
    uint256 private _listingIds;
    uint256 private _orderIds;
    
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
    
    constructor() Ownable(msg.sender) {}
    
    // Create a new product listing
    function createListing(
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _price,
        uint256 _quantity,
        string memory _location,
        string memory _imageUrl
    ) external {
        require(_price > 0, "Price must be greater than 0");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
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
        
        emit ListingCreated(newListingId, msg.sender, _name, _price, _quantity);
    }
    
    // Purchase a product (creates order with escrow)
    function purchaseProduct(
        uint256 _listingId,
        uint256 _quantity
    ) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        
        require(listing.listingId != 0, "Listing does not exist");
        require(listing.status == ListingStatus.Active, "Listing is not active");
        require(listing.seller != msg.sender, "Cannot buy your own product");
        require(_quantity > 0 && _quantity <= listing.quantity, "Invalid quantity");
        
        uint256 totalPrice = listing.price * _quantity;
        require(msg.value >= totalPrice, "Insufficient payment");
        
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
            escrowAmount: msg.value,
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
    
    // Emergency functions (only owner)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
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