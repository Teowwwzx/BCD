// src/components/OrderTracker.tsx
'use client';

import React from 'react';
import { Order, OrderStatus } from '../types';

interface OrderTrackerProps {
    order: Order;
}

const OrderTracker = ({ order }: OrderTrackerProps) => {
    const statuses: OrderStatus[] = [
        OrderStatus.Confirmed,
        OrderStatus.Processing,
        OrderStatus.Shipped,
        OrderStatus.Delivered,
    ];

    const getStatusIndex = (status: OrderStatus) => {
        const index = statuses.indexOf(status);
        // Treat 'pending' as the step before 'confirmed'
        return status === OrderStatus.Pending ? -1 : index;
    };

    const currentStatusIndex = getStatusIndex(order.order_status);

    return (
        <div className="p-4 font-mono-pixel">
            <div className="flex items-center">
                {statuses.map((status, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isActive = index === currentStatusIndex;

                    return (
                        <React.Fragment key={status}>
                            {/* Connecting Line (not for the first item) */}
                            {index > 0 && (
                                <div className={`flex-1 h-1 ${isCompleted || isActive ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                            )}

                            {/* Status Step */}
                            <div className="flex flex-col items-center mx-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-500 border-green-500' :
                                        isActive ? 'bg-green-500 border-green-500 animate-pulse' :
                                            'bg-gray-700 border-gray-600'
                                    }`}>
                                    {isCompleted && <span className="text-white">✓</span>}
                                </div>
                                <p className={`mt-2 text-xs text-center ${isCompleted || isActive ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </p>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h4 className="font-pixel text-white">// CURRENT_STATUS</h4>
                <p className="text-lg text-[#00f5c3] mt-1">{order.order_status.toUpperCase()}</p>
            </div>
        </div>
    );
};

export default OrderTracker;