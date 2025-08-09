export interface User {
    id: string;
    username: string;
    email: string;
    f_name?: string;
    l_name?: string;
    phone?: string;
    dob?: Date;
    user_role?: 'buyer' | 'seller' | 'admin';
    createdAt: string;
    updatedAt: string;
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

export interface ProductImage {
    imageUrl: string;
    altText?: string;
}

export interface OrderItem {
    quantity: number;
    unitPrice: number;
    product_name: string;
}

export interface CartItem {
    id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number;
        image: ProductImage;
    };
}

export interface Order {
    id: number;
    order_status: string;
    totalAmount: number;
    orderItems: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
}