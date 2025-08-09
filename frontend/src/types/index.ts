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


// =================================================================
// CORE MODELS - A precise reflection of our `schema.prisma`
// =================================================================
export interface User {
    id: string;
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
    address_type: 'shipping' | 'billing';
    addr_line_1: string;
    addr_line_2?: string | null;
    city: string;
    state: string;
    postcode: string;
    country: string;
}
export interface Product {
    id: number;
    name: string;
    description: string;
    category: { name: string };
    price: number;
    quantity: number;
    status: string;
    rating: number;
    review: string;
    images: ProductImage[];
    isBlockchain: boolean;
    seller: {
        username: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface Category {
    id: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
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
    order_status: OrderStatus;
    payment_status: 'pending' | 'paid' | 'failed';
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
    orderItems: OrderItem[];
    shippingAddress: Address;
    billingAddress: Address;
    buyer: {
        username: string;
    };
}
export interface OrderItem {
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product_name: string;
    product_image_url?: string | null;
    product?: {
        id: number;
    };
}
export interface Review {
    id: number;
    rating: number;
    title?: string | null;
    review_text?: string | null;
    is_verified_purchase: boolean;
    status: 'pending' | 'approved' | 'rejected';
    user: {
        username: string;
        profileImageUrl?: string | null;
    };
    createdAt: string;
}


// =================================================================
// UI-LEVEL & CONTEXT-SPECIFIC TYPES
// =================================================================
export interface CartItem {
    id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number;
        images?: ProductImage[];
    };
}
export interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
}