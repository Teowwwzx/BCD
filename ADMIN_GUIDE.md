# BCD Marketplace Admin Guide

## 🛡️ Admin Dashboard Overview

The BCD Marketplace now includes a comprehensive admin dashboard for platform management and oversight.

## 🚀 Getting Started

### 1. Database Setup & Seeding

First, ensure your database is set up with the latest schema and seeded with test data:

```bash
# Navigate to backend directory
cd backend

# Run database migration (adds Admin role)
npx prisma migrate dev --name add-admin-role

# Seed the database with fake data
npm run seed

# Alternative: Reset database and seed in one command
npm run db:reset
```

### 2. Admin Credentials

After seeding, you can use these admin accounts to test the dashboard:

**Primary Admin:**
- Email: `admin@bcdmarketplace.com`
- Password: `admin123`
- Wallet: `0x1234567890123456789012345678901234567890`

**Super Admin:**
- Email: `superadmin@bcdmarketplace.com`
- Password: `superadmin123`
- Wallet: `0x2345678901234567890123456789012345678901`

### 3. Accessing the Admin Dashboard

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click "Login" and use one of the admin credentials above

4. Once logged in as an admin, you'll see a red "🛡️ Admin" link in the navigation

5. Click the Admin link to access the dashboard at `/admin`

## 📊 Dashboard Features

### Overview Tab
- **Platform Statistics**: Total users, products, orders, and revenue
- **Recent Orders**: Latest transactions with status tracking
- **Top Products**: Best-performing products by category
- **Real-time Metrics**: Live dashboard updates

### Users Tab
- **User Management**: View all registered users
- **Role-based Filtering**: Filter by user roles (Admin, Manufacturer, Supplier, etc.)
- **User Actions**: Edit user details, suspend accounts
- **Reputation Tracking**: Monitor user reputation scores

### Products Tab
- **Product Catalog**: Complete product inventory
- **Category Management**: Organize products by categories
- **Stock Monitoring**: Track inventory levels
- **Product Actions**: Edit, remove, or moderate listings

### Orders Tab
- **Order Management**: View all platform transactions
- **Status Tracking**: Monitor order fulfillment pipeline
- **Transaction Details**: Complete order history and amounts
- **Order Actions**: View details, cancel problematic orders

## 🎯 Seeded Test Data

The seed script creates realistic test data including:

### Users (7 total)
- **2 Admin users** with full platform access
- **5 Regular users** across different roles:
  - Manufacturers (tech companies)
  - Suppliers (raw materials)
  - Distributors (regional coverage)
  - Retailers (consumer-facing)
  - Logistics (shipping services)

### Products (5 total)
- Industrial IoT Sensor Modules
- Premium Steel Alloy Sheets
- Smart LED Display Panels
- Organic Cotton Fabric Rolls
- Professional Power Tools Sets

### Orders (3 total)
- Various order statuses (Completed, InTransit, AwaitingShipment)
- Realistic pricing and quantities
- Complete buyer-seller relationships

### Additional Data
- **Shipments**: Tracking numbers and delivery status
- **Reviews**: User feedback and ratings
- **Attachments**: Product documentation and certificates

## 🔐 Security Features

### Access Control
- **Role-based Authentication**: Only users with `Admin` role can access dashboard
- **Automatic Redirection**: Non-admin users are redirected to home page
- **Session Management**: Secure login/logout functionality

### Admin Identification
- **Visual Indicators**: Red admin link in navigation
- **Shield Icon**: 🛡️ symbol for easy identification
- **Separate Styling**: Distinct UI elements for admin features

## 🛠️ Development Notes

### Database Schema Changes
- Added `Admin` role to `UserRole` enum
- Maintains backward compatibility with existing roles
- Migration safely updates existing data

### Frontend Integration
- Admin dashboard is a protected route at `/admin`
- Integrates with existing `WalletContext` for authentication
- Responsive design works on desktop and mobile
- Uses Tailwind CSS for consistent styling

### Mock Data vs Production
- Current implementation uses mock data for demonstration
- In production, replace with actual API calls to backend
- Database is properly seeded with realistic test scenarios

## 🚀 Next Steps

1. **API Integration**: Connect dashboard to real backend APIs
2. **Advanced Analytics**: Add charts and graphs for better insights
3. **Bulk Operations**: Enable batch actions for users/products
4. **Export Features**: Add data export capabilities
5. **Real-time Updates**: Implement WebSocket for live data
6. **Audit Logging**: Track admin actions for compliance

## 📞 Support

For questions about the admin dashboard:
1. Check the console for any error messages
2. Verify database connection and seeded data
3. Ensure you're logged in with admin credentials
4. Confirm the frontend server is running on the correct port

---

**Happy Administrating! 🎉**