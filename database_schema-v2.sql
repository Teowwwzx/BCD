-- BCD Marketplace Database Schema (PostgreSQL Compatible)
-- Version 2.0
-- Last Updated: August 5, 2025

-- =================================================================
-- STEP 1: DEFINE ALL CUSTOM ENUM TYPES
-- =================================================================
CREATE TYPE user_role_enum AS ENUM('Buyer', 'Seller', 'Admin');
CREATE TYPE address_type_enum AS ENUM('shipping', 'billing');
CREATE TYPE wallet_type_enum AS ENUM('MetaMask', 'WalletConnect', 'Coinbase', 'Other');
CREATE TYPE product_status_enum AS ENUM('draft', 'active', 'inactive', 'out_of_stock', 'discontinued');
CREATE TYPE order_status_enum AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status_enum AS ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE transaction_type_enum AS ENUM('payment', 'refund', 'partial_refund');
CREATE TYPE shipment_status_enum AS ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned');
CREATE TYPE discount_type_enum AS ENUM('percentage', 'fixed_amount');
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
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image_url VARCHAR(500),
    user_role user_role_enum DEFAULT 'Buyer',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses for shipping and billing
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    address_type address_type_enum NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet information for blockchain transactions
CREATE TABLE user_wallets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    wallet_type wallet_type_enum NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories for organizing products
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id INT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products table - Core product information
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    sku VARCHAR(100) UNIQUE,
    price_eth DECIMAL(18, 8) NOT NULL,
    price_usd DECIMAL(10, 2),
    stock_quantity INT NOT NULL DEFAULT 0,
    min_order_quantity INT DEFAULT 1,
    max_order_quantity INT,
    weight_kg DECIMAL(8, 3),
    dimensions_length_cm DECIMAL(8, 2),
    dimensions_width_cm DECIMAL(8, 2),
    dimensions_height_cm DECIMAL(8, 2),
    status product_status_enum DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    shipping_required BOOLEAN DEFAULT TRUE,
    tax_class VARCHAR(50) DEFAULT 'standard',
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Product images
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product attributes (size, color, material, etc.)
CREATE TABLE product_attributes (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Shopping cart
CREATE TABLE shopping_cart (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id)
);

-- Wishlist/Favorites
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

-- Orders table - Main order information
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id INT NOT NULL,
    order_status order_status_enum DEFAULT 'pending',
    payment_status payment_status_enum DEFAULT 'pending',
    subtotal_eth DECIMAL(18, 8) NOT NULL,
    tax_amount_eth DECIMAL(18, 8) DEFAULT 0,
    shipping_amount_eth DECIMAL(18, 8) DEFAULT 0,
    discount_amount_eth DECIMAL(18, 8) DEFAULT 0,
    total_amount_eth DECIMAL(18, 8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    exchange_rate_usd DECIMAL(10, 2),
    total_amount_usd DECIMAL(10, 2),
    shipping_first_name VARCHAR(100),
    shipping_last_name VARCHAR(100),
    shipping_company VARCHAR(100),
    shipping_address_line_1 VARCHAR(255),
    shipping_address_line_2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state_province VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),
    shipping_phone VARCHAR(20),
    billing_first_name VARCHAR(100),
    billing_last_name VARCHAR(100),
    billing_company VARCHAR(100),
    billing_address_line_1 VARCHAR(255),
    billing_address_line_2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state_province VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    billing_phone VARCHAR(20),
    transaction_hash VARCHAR(255),
    block_number BIGINT,
    gas_used BIGINT,
    gas_price_gwei DECIMAL(18, 8),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Order items - Individual products in an order
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    seller_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price_eth DECIMAL(18, 8) NOT NULL,
    total_price_eth DECIMAL(18, 8) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    product_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    amount_eth DECIMAL(18, 8) NOT NULL,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    block_number BIGINT,
    gas_used BIGINT,
    gas_price_gwei DECIMAL(18, 8),
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    status payment_status_enum DEFAULT 'pending',
    confirmation_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);

-- Shipping information and tracking
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    carrier VARCHAR(100),
    tracking_number VARCHAR(255),
    shipping_method VARCHAR(100),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    shipping_cost_eth DECIMAL(18, 8),
    weight_kg DECIMAL(8, 3),
    status shipment_status_enum DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    is_approved BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    minimum_order_amount_eth DECIMAL(18, 8),
    maximum_discount_amount_eth DECIMAL(18, 8),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    user_usage_limit INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupon usage tracking
CREATE TABLE coupon_usage (
    id SERIAL PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    discount_amount_eth DECIMAL(18, 8) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    related_order_id INT,
    related_product_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
CREATE TRIGGER update_shopping_cart_updated_at BEFORE UPDATE ON shopping_cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);


-- =================================================================
-- STEP 6: INSERT DEFAULT DATA
-- =================================================================

-- Insert default categories
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

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('site_name', 'BCD Marketplace', 'Name of the marketplace', true),
('site_description', 'A modern blockchain-powered marketplace', 'Site description', true),
('default_currency', 'ETH', 'Default cryptocurrency', true),
('tax_rate', '0.08', 'Default tax rate (8%)', false),
('shipping_rate_per_kg', '0.001', 'Shipping cost per kg in ETH', false),
('min_order_amount', '0.001', 'Minimum order amount in ETH', true),
('max_order_amount', '100', 'Maximum order amount in ETH', true),
('order_confirmation_blocks', '12', 'Number of blocks to wait for order confirmation', false),
('featured_products_limit', '20', 'Number of featured products to display', true),
('review_moderation_enabled', 'true', 'Whether reviews require moderation', false);