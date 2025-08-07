-- BCD Marketplace Database Schema (PostgreSQL Compatible)
-- Version 3.0
-- Last Updated: August 7, 2025


-- =================================================================
-- STEP 1: DEFINE ALL CUSTOM ENUM TYPES
-- =================================================================
CREATE TYPE user_role_enum AS ENUM('buyer', 'seller', 'admin');
CREATE TYPE user_status_enum AS ENUM('active', 'inactive', 'suspended', 'pending_verification');

CREATE TYPE address_type_enum AS ENUM('shipping', 'billing');
CREATE TYPE location_type_enum AS ENUM('residential', 'company');

CREATE TYPE product_status_enum AS ENUM('published', 'draft', 'archived');
CREATE TYPE category_status_enum AS ENUM('active', 'inactive');

CREATE TYPE order_status_enum AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status_enum AS ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE transaction_status_enum AS ENUM('pending', 'confirmed', 'failed');
CREATE TYPE shipment_status_enum AS ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned');

CREATE TYPE review_status_enum AS ENUM('pending', 'approved', 'rejected');

CREATE TYPE discount_type_enum AS ENUM('percentage', 'fixed_amount');
CREATE TYPE coupon_status_enum AS ENUM('active', 'inactive', 'expired');

CREATE TYPE notification_type_enum AS ENUM('order_update', 'payment_received', 'product_review', 'system_message', 'promotion');


-- =================================================================
-- STEP 2: DEFINE THE TRIGGER FUNCTION FOR 'updated_at'
-- =================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';


-- =================================================================
-- STEP 3: CREATE ALL TABLES
-- =================================================================

-- Users table - Core user information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    f_name VARCHAR(100),
    l_name VARCHAR(100),
    phone VARCHAR(20),
    dob DATE,
    profile_image_url VARCHAR(500),
    user_role user_role_enum DEFAULT 'buyer',
    status user_status_enum DEFAULT 'pending_verification',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User addresses for shipping and billing
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    address_type address_type_enum NOT NULL,
    location_type location_type_enum NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet information for blockchain transactions
CREATE TABLE user_wallets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    wallet_addr VARCHAR(255) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products table - Core product information
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_desc VARCHAR(500),
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(18, 8) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_order_quant INT DEFAULT 1,
    max_order_quant INT,
    weight_kg DECIMAL(8, 3),
    dimensions_length_cm DECIMAL(8, 2),
    dimensions_width_cm DECIMAL(8, 2),
    dimensions_height_cm DECIMAL(8, 2),
    status product_status_enum DEFAULT 'draft',
    is_digital BOOLEAN DEFAULT FALSE,
    tax_class VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Product images
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Categories for organizing products
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id INT,
    image_url VARCHAR(500),
    status category_status_enum DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Product attributes (size, color, material, etc.)
CREATE TABLE product_attributes (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    attr_name VARCHAR(100) NOT NULL,
    attr_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Shopping cart
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id)
);

-- Wishlist/Favorites
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

-- Orders table - Main order information
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    buyer_id INT NOT NULL,
    shipping_address_id INT NOT NULL,
    billing_address_id INT NOT NULL,
    payment_id INT UNIQUE,
    order_status order_status_enum NOT NULL DEFAULT 'pending',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(18, 8) NOT NULL,
    tax_amount DECIMAL(18, 8) DEFAULT 0,
    shipping_amount DECIMAL(18, 8) DEFAULT 0,
    discount_amount DECIMAL(18, 8) DEFAULT 0,
    total_amount DECIMAL(18, 8) NOT NULL,
    coin_to_usd_rate DECIMAL(10, 2),
    tx_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id) ON DELETE RESTRICT,
    FOREIGN KEY (billing_address_id) REFERENCES user_addresses(id) ON DELETE RESTRICT
);

-- Order items - Individual products in an order
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    seller_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(18, 8) NOT NULL,
    total_price DECIMAL(18, 8) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    product_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    gas_used BIGINT,
    gas_price_gwei DECIMAL(18, 8),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    status transaction_status_enum NOT NULL DEFAULT 'pending',
    confirmation_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);

-- Shipping information and tracking
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    carrier VARCHAR(100),
    tracking_number VARCHAR(255),
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(18, 8),
    weight_kg DECIMAL(8, 3),
    status shipment_status_enum DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Product reviews and ratings
CREATE TABLE product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_item_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    status review_status_enum NOT NULL DEFAULT 'pending',
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

-- Coupons and discount codes
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_type discount_type_enum NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    minimum_order_amount DECIMAL(18, 8),
    maximum_discount_amount DECIMAL(18, 8),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    user_usage_limit INT DEFAULT 1,
    status coupon_status_enum NOT NULL DEFAULT 'active',
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon usage tracking
CREATE TABLE coupon_usage (
    id SERIAL PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    discount_amount DECIMAL(18, 8) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Notifications system
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type notification_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    related_order_id INT,
    related_product_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- System settings and configuration
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for important actions
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- =================================================================
-- STEP 4: CREATE TRIGGERS TO AUTOMATE 'updated_at'
-- =================================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wishlist_updated_at BEFORE UPDATE ON wishlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =================================================================
-- For Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);

-- For Products table
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);

-- For Orders table
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- For Order Items table
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_seller_id ON order_items(seller_id);

-- For Product Reviews table
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_status ON product_reviews(status);

-- For Notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);


-- =================================================================
-- STEP 6: SEEDING DEFAULT DATA
-- =================================================================
INSERT INTO users (username, email, password_hash, f_name, l_name, user_role, status) VALUES
('admin', 'admin@example.com', '$2a$12$PoXVRS6Pi173bsmz8MecFeTZyATmb8rZZG.yy8d4VNrD3qbpNlp.C', 'Admin', 'User', 'admin', 'active'),
('seller', 'seller@example.com', '$2a$12$PoXVRS6Pi173bsmz8MecFeTZyATmb8rZZG.yy8d4VNrD3qbpNlp.C', 'Super', 'Seller', 'seller', 'active'),
('buyer', 'buyer@example.com', '$2a$12$PoXVRS6Pi173bsmz8MecFeTZyATmb8rZZG.yy8d4VNrD3qbpNlp.C', 'Regular', 'Buyer', 'buyer', 'active'),
('buyer2', 'buyer2@example.com', '$2a$12$PoXVRS6Pi173bsmz8MecFeTZyATmb8rZZG.yy8d4VNrD3qbpNlp.C', 'Buyer', '2', 'buyer', 'active');


-- Addresses for the Seller (user_id = 2)
INSERT INTO user_addresses (user_id, address_type, location_type, is_default, addr_line_1, city, state, postcode, country) VALUES
(2, 'shipping', 'company', true, '123 Business Rd', 'Kuala Lumpur', 'W.P. Kuala Lumpur', '50480', 'Malaysia');

-- Addresses for John Doe (user_id = 4)
INSERT INTO user_addresses (user_id, address_type, location_type, is_default, addr_line_1, city, state, postcode, country, remark) VALUES
(4, 'shipping', 'residential', true, '456 Home Street, Apt 7B', 'Petaling Jaya', 'Selangor', '47301', 'Malaysia', 'Leave at front desk if not home.'),
(4, 'billing', 'residential', true, '456 Home Street, Apt 7B', 'Petaling Jaya', 'Selangor', '47301', 'Malaysia');


-- Wallets for all users
INSERT INTO user_wallets (user_id, wallet_addr, is_verified) VALUES
(1, '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6', true),
(2, '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', true),
(3, '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', true),
(4, '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', true);


-- SEEDING default categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing & Fashion', 'Apparel, shoes, and fashion accessories'),
('Home & Garden', 'Home improvement, furniture, and garden supplies'),
('Sports & Outdoors', 'Sports equipment and outdoor gear'),
('Books & Media', 'Books, movies, music, and digital media'),
('Health & Beauty', 'Health products, cosmetics, and personal care'),
('Toys & Games', 'Toys, games, and hobby items'),
('Automotive', 'Car parts, accessories, and automotive supplies'),
('Food & Beverages', 'Food items and beverages'),
('Digital Products', 'Software, digital downloads, and online services');


-- Add a sub-category
INSERT INTO categories (name, description, parent_category_id) VALUES
('Smartphones', 'The latest mobile phones', 1);


-- Product 1: Laptop
INSERT INTO products (seller_id, category_id, name, description, short_desc, sku, price, quantity, weight_kg, status) VALUES
(2, 1, 'ProBook X1 Laptop', 'A high-performance laptop for professionals.', '16GB RAM, 512GB SSD', 'LP-PRO-X1', 0.5, 50, 1.5, 'published');
-- Product 2: T-Shirt
INSERT INTO products (seller_id, category_id, name, description, short_desc, sku, price, quantity, weight_kg, status) VALUES
(2, 2, 'Classic Cotton T-Shirt', 'A soft and durable 100% cotton t-shirt.', 'Available in multiple colors', 'TS-COT-CLASSIC', 0.01, 200, 0.2, 'published');
-- Product 3: Digital E-Book
INSERT INTO products (seller_id, category_id, name, description, sku, price, quantity, is_digital, status) VALUES
(2, 4, 'Guide to Solidity', 'A comprehensive guide to smart contract development.', 'BK-SOL-GUIDE', 0.05, 9999, true, 'published');


-- Add images for the Laptop (product_id = 1)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES
(1, 'https://example.com/laptop_front.jpg', 'Front view of the ProBook X1 Laptop', 0),
(1, 'https://example.com/laptop_side.jpg', 'Side view of the ProBook X1 Laptop showing ports', 1);


-- Add attributes for the T-Shirt (product_id = 2)
INSERT INTO product_attributes (product_id, attr_name, attr_value) VALUES
(2, 'Color', 'Midnight Blue'),
(2, 'Size', 'Large'),
(2, 'Material', '100% Cotton');


-- Add items to John Doe's cart (user_id = 4)
INSERT INTO cart (user_id, product_id, quantity) VALUES
(4, 1, 1), -- 1 Laptop
(4, 2, 3); -- 3 T-Shirts


-- Add an item to the regular buyer's wishlist (user_id = 3)
INSERT INTO wishlist (user_id, product_id) VALUES
(3, 3); -- Guide to Solidity e-book


INSERT INTO orders (buyer_id, shipping_address_id, billing_address_id, order_status, payment_status, subtotal, tax_amount, shipping_amount, total_amount, eth_to_usd_rate, tx_hash, block_number) VALUES
(4, 2, 3, 'delivered', 'paid', 0.02, 0.001, 0.002, 0.023, 3500.50, '0xabc123...', 1234567);


-- Add the items that were in that order (order_id = 1)
INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, product_name, product_sku) VALUES
(1, 2, 2, 2, 0.01, 0.02, 'Classic Cotton T-Shirt', 'TS-COT-CLASSIC'); -- 2 t-shirts


-- Add the payment transaction for the order
INSERT INTO payment_transactions (order_id, transaction_type, amount, tx_hash, block_number, from_address, to_address, status, confirmed_at) VALUES
(1, 'payment', 0.023, '0xabc123...', 1234567, '0x90F79bf6EB2c4f870365E785982E1f101E93b906', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'confirmed', NOW() - INTERVAL '10 day');


-- Add the shipment record for the order
INSERT INTO shipments (order_id, carrier, tracking_number, shipping_method, status, updated_at) VALUES
(1, 'DHL Express', 'DHL123456789', 'Standard International', 'delivered', NOW() - INTERVAL '5 day');


INSERT INTO product_reviews (product_id, user_id, order_item_id, rating, title, review_text, is_verified_purchase, status) VALUES
(2, 4, 1, 5, 'Excellent Quality!', 'The t-shirts are very comfortable and the color is great. Highly recommend.', true, 'approved');


INSERT INTO notifications (user_id, type, title, message, related_order_id) VALUES
(4, 'order_update', 'Your Order Has Shipped!', 'Your order ORD-2025-00001 has been shipped by DHL Express.', 1),
(4, 'order_update', 'Your Order Was Delivered', 'Your order ORD-2025-00001 has been successfully delivered.', 1);


-- SEEDING default system settings
-- INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
-- ('site_name', 'BCD Marketplace', 'Name of the marketplace', true),
-- ('site_description', 'A modern blockchain-powered marketplace', 'Site description', true),
-- ('default_currency', 'ETH', 'Default cryptocurrency', true),
-- ('tax_rate', '0.08', 'Default tax rate (8%)', false),
-- ('shipping_rate_per_kg', '0.001', 'Shipping cost per kg in ETH', false),
-- ('min_order_amount', '0.001', 'Minimum order amount in ETH', true),
-- ('max_order_amount', '100', 'Maximum order amount in ETH', true),
-- ('order_confirmation_blocks', '12', 'Number of blocks to wait for order confirmation', false),
-- ('featured_products_limit', '20', 'Number of featured products to display', true),
-- ('review_moderation_enabled', 'true', 'Whether reviews require moderation', false);