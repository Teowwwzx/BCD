// frontend/src/types/index.ts

// =================================================================
// ENUMS - Derived directly from the schema for type safety
// =================================================================
export enum UserRole {
    Buyer = 'buyer',
    Seller = 'seller',
    Admin = 'admin',
}

export enum UserStatus {
    Active = 'active',
    Inactive = 'inactive',
    Suspended = 'suspended',
    PendingVerification = 'pending_verification',
}

export enum ProductStatus {
    Published = 'published',
    Draft = 'draft',
    Archived = 'archived',
}

export enum OrderStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Processing = 'processing',
    Shipped = 'shipped',
    Delivered = 'delivered',
    Cancelled = 'cancelled',
    Refunded = 'refunded',
}

export enum PaymentStatus {
    Pending = 'pending',
    Paid = 'paid',
    Failed = 'failed',
    Refunded = 'refunded',
    PartiallyRefunded = 'partially_refunded'
}

export enum ReviewStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected'
}

export enum AddressType {
    Shipping = 'shipping',
    Billing = 'billing'
}

// =================================================================
// CORE MODELS - A precise reflection of our `schema.prisma`
// =================================================================
export interface User {
    id: number;
    username: string;
    email: string;
    f_name?: string | null;
    l_name?: string | null;
    phone?: string | null;
    dob?: string | null;
    profileImageUrl?: string | null;
    user_role?: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}
export interface Address {
    id: number;
    user_id: number;
    address_type: AddressType;
    location_type: 'residential' | 'company';
    is_default: boolean;
    addr_line_1: string;
    addr_line_2?: string | null;
    city: string;
    state: string;
    postcode: string;
    country: string;
}
export interface Product {
    id: number;
    sellerId: number;
    categoryId?: number | null;
    name: string;
    description?: string | null;
    short_desc?: string | null;
    sku?: string | null;
    price: number; // Prisma's Decimal is represented as number in JS/TS
    stock_quantity: number;
    min_order_quant?: number | null;
    max_order_quant?: number | null;
    status: ProductStatus;
    isDigital: boolean;
    createdAt: string;
    updatedAt: string;

    // Relational fields
    seller: {
        username: string;
    };
    category?: {
        name: string;
    } | null;
    images?: ProductImage[];
    product_reviews?: Review[];
}

export interface Category {
    id: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    status: 'active' | 'inactive';
}
export interface ProductImage {
    id: number;
    imageUrl: string;
    altText?: string | null;
    sortOrder?: number;
}
export interface Order {
    id: number;
    uuid: string;
    buyer_id: number;
    shippingAddressId: number;
    billingAddressId: number;
    order_status: OrderStatus;
    payment_status: PaymentStatus;
    subtotal: number;
    taxAmount?: number | null;
    shippingAmount?: number | null;
    discountAmount?: number | null;
    totalAmount: number;
    tx_hash?: string | null;
    createdAt: string;
    updatedAt: string;

    // Relations
    orderItems: OrderItem[];
    shippingAddress: Address;
    billingAddress: Address;
    users: {
        username: string;
    };
}
export interface OrderItem {
    id: number;
    orderId: number;
    productId?: number | null;
    seller_id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product_name: string;
    product_image_url?: string | null;
    product?: {
        id: number;
    } | null;
}
export interface Review {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    title?: string | null;
    review_text?: string | null;
    is_verified_purchase: boolean;
    status: ReviewStatus;
    helpful_count: number;
    createdAt: string;
    updatedAt: string;

    // Relational fields
    user: {
        username: string;
        profileImageUrl?: string | null;
    };
}


// =================================================================
// UI-LEVEL & CONTEXT-SPECIFIC TYPES
// =================================================================
export interface CartItem {
    id: number;
    userId: number;
    productId: number;
    quantity: number;
    weight?: number;
    product: {
        id: number;
        name: string;
        price: number;
        images?: ProductImage[];
        stock_quantity: number;
    };
}

export interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalSalesVolume: number;
    newUsersThisMonth: number;
    pendingProducts: number;
    openDisputes: number;
}


// =================================================================
// THEME & UI TYPES
// =================================================================

export type Theme = 'light' | 'dark';

// =================================================================
// PAYMENT & SHIPPING TYPES
// =================================================================

export enum PaymentMethod {
    Gateway = 'gateway',
    Wallet = 'wallet'
}

export enum TransactionStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Failed = 'failed'
}

export interface PaymentTransaction {
    id: number;
    orderId: number;
    amount: string;
    tx_hash?: string | null;
    blockNumber?: number | null;
    gasUsed?: number | null;
    gas_price_gwei?: string | null;
    from_address?: string | null;
    to_address?: string | null;
    status: TransactionStatus;
    confirmation_count?: number | null;
    payment_method?: PaymentMethod | null;
    gateway_transaction_id?: string | null;
    gateway_response?: any | null;
    processing_fee?: string | null;
    createdAt: string;
    confirmed_at?: string | null;
}

export interface ShippingMethod {
    id: number;
    name: string;
    description?: string | null;
    base_cost: string;
    cost_per_kg?: string | null;
    cost_per_km?: string | null;
    estimated_days_min: number;
    estimated_days_max: number;
    is_active: boolean;
    trackingAvailable?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CheckoutData {
    shippingAddressId: number;
    billingAddressId: number;
    shippingMethodId: number;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    items?: {
        productId: number;
        quantity: number;
        price: number;
    }[];
    // Gateway payment fields
    gatewayToken?: string;
    // Wallet payment fields
    fromAddress?: string;
    toAddress?: string;
    txHash?: string;
    blockNumber?: number;
    gasUsed?: number;
    gasPriceGwei?: string;
}

export interface OrderCalculation {
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    totalAmount: number;
    processingFee?: number;
}