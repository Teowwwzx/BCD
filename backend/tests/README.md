# BCD Marketplace - Automated API Testing Suite

This directory contains a comprehensive automated testing suite for the BCD Marketplace backend API. The testing system provides role-based access control testing across all endpoints, eliminating the need for manual Postman testing.

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- Database properly configured and migrated
- Prisma client generated (`npm run db:generate`)
- Environment variables configured (`.env` file with `DATABASE_URL`)

### Run All Tests Automatically
```bash
# Run the complete automated test suite with detailed reporting
npm run test:api:auto

# Alternative: Run all API tests with Jest
npm run test:api
```

### Run Individual Test Suites
```bash
# Authentication tests (register, login, profile)
npm run test:auth

# User management tests (role-based CRUD)
npm run test:users

# Product management tests (seller/admin permissions)
npm run test:products

# Order management tests (buyer/seller/admin workflows)
npm run test:orders
```

## 📋 Test Coverage

The automated testing suite covers:

### 🔐 Authentication API (`auth.test.js`)
- **User Registration**: Tests for buyer, seller, and admin role registration
- **User Login**: Validates credentials and token generation for all roles
- **Profile Access**: Tests authenticated profile retrieval
- **Error Handling**: Invalid credentials, missing fields, duplicate emails

### 👥 Users API (`users.test.js`)
- **Create User**: Admin-only user creation permissions
- **Get All Users**: Admin access with filtering capabilities
- **Get User by ID**: Role-based access (own profile vs others)
- **Update User**: Self-update permissions and admin override
- **Delete User**: Admin-only deletion with self-deletion restrictions

### 📦 Products API (`products.test.js`)
- **Create Product**: Seller and admin creation permissions
- **Get All Products**: Public access with filtering
- **Get Product by ID**: Public product viewing
- **Update Product**: Seller (own products) and admin permissions
- **Delete Product**: Seller (own products) and admin permissions
- **Cross-Seller Restrictions**: Prevents sellers from modifying others' products

### 🛒 Orders API (`orders.test.js`)
- **Create Order**: Buyer order creation and admin override
- **Get All Orders**: Role-based order visibility
- **Get Order by ID**: Owner and admin access
- **Update Order**: Status updates based on role permissions
- **Delete Order**: Order cancellation permissions
- **Cross-User Restrictions**: Prevents access to others' orders

## 🛠️ Test Data Management

### Seeding Test Data
```bash
# Seed all test data (categories, users, products, orders)
npm run seed:test

# Clean all test data
npm run seed:test:clean

# Reset (clean + reseed) all test data
npm run seed:test:reset

# Seed specific data types
node tests/seeders.js categories
node tests/seeders.js users
node tests/seeders.js products
node tests/seeders.js orders
```

### Test Data Includes
- **5 Categories**: Electronics, Clothing, Books, Home & Garden, Sports
- **5 Test Users**: Buyers, sellers, and admin with different statuses
- **7 Products**: Various categories, stock levels, and statuses
- **4 Shipping Methods**: Standard, express, overnight, and free shipping
- **5 System Settings**: Site configuration for testing
- **3 Sample Orders**: Different statuses and payment methods

## 📊 Test Reporting

The automated test runner (`test-runner.js`) provides:

### Console Output
- **Real-time Progress**: Live updates during test execution
- **Color-coded Results**: Success (green), errors (red), warnings (yellow)
- **Detailed Summary**: Pass/fail counts, success rates, duration
- **Failed Test Details**: Specific failure messages and recommendations

### Generated Reports
- **JSON Report**: Detailed results saved to `test-report.json`
- **Suite Breakdown**: Individual test suite performance
- **Role-based Summary**: Confirmation of permission testing coverage

### Sample Output
```
📋 BCD MARKETPLACE API TEST REPORT
================================================================================

📈 OVERALL SUMMARY:
   Total Tests: 45
   Passed: 43
   Failed: 2
   Skipped: 0
   Success Rate: 95.56%
   Total Duration: 12.34s

🔐 ROLE-BASED ACCESS CONTROL TESTING:
   ✅ Buyer role permissions tested
   ✅ Seller role permissions tested
   ✅ Admin role permissions tested
   ✅ Unauthenticated access tested
   ✅ Cross-role access restrictions tested
```

## 🏗️ Test Architecture

### Setup (`setup.js`)
- **Database Configuration**: Separate test Prisma client
- **Test Users**: Predefined credentials for each role
- **Helper Functions**: Authentication and request utilities
- **Cleanup Hooks**: Automatic test data cleanup

### Test Structure
Each test file follows a consistent pattern:
1. **Setup**: Create authenticated users for each role
2. **Test Cases**: Comprehensive CRUD operation testing
3. **Permission Validation**: Role-based access control verification
4. **Error Handling**: Invalid requests and edge cases
5. **Cleanup**: Automatic data cleanup after each test

### Authentication Flow
```javascript
// Automatic user creation and authentication
const { token, user } = await createAndLoginUser('buyer');
const authReq = authenticatedRequest(app, token);

// Make authenticated requests
const response = await authReq.get('/api/users/profile');
```

## 🔧 Configuration

### Environment Variables
Ensure these are set in your `.env` file:
```env
DATABASE_URL="your-test-database-url"
JWT_SECRET="your-jwt-secret"
NODE_ENV="test"
```

### Jest Configuration
Tests use the configuration in `jest.config.js`:
- **Test Environment**: Node.js
- **Test Pattern**: `**/tests/**/*.test.js`
- **Setup File**: `tests/setup.js`
- **Timeout**: 10 seconds per test

## 🚨 Troubleshooting

### Common Issues

**Environment Variable Issues**
```bash
# Error: Environment variable not found: DATABASE_URL
# Solution: Ensure .env file exists in backend directory with DATABASE_URL

# Check if .env file exists
ls -la .env

# Verify DATABASE_URL is set
cat .env | grep DATABASE_URL

# If missing, create .env file with your database connection string:
echo "DATABASE_URL=postgresql://username:password@localhost:5432/database_name" > .env
```

**Database Connection Errors**
```bash
# Ensure database is running and accessible
npm run db:generate
npm run db:migrate
```

**Prisma Client Issues**
```bash
# Regenerate Prisma client
npm run db:generate
```

**Test Data Conflicts**
```bash
# Reset test data
npm run seed:test:reset
```

**Permission Errors**
```bash
# Check if routes implement proper authentication middleware
# Verify JWT_SECRET is set correctly
```

### Debug Mode
```bash
# Run tests with verbose output
npm run test:api -- --verbose

# Run specific test with debugging
npm run test:auth -- --verbose --no-cache
```

## 📈 Best Practices

### Running Tests
1. **Always reset test data** before running full test suite
2. **Run individual suites** during development for faster feedback
3. **Check test reports** for detailed failure analysis
4. **Use seeded data** for consistent test environments

### Adding New Tests
1. **Follow existing patterns** in test file structure
2. **Test all user roles** for new endpoints
3. **Include error cases** and edge conditions
4. **Update seeders** if new test data is needed

### Continuous Integration
```bash
# Recommended CI pipeline
npm run seed:test:reset  # Reset test data
npm run test:api:auto    # Run automated tests
# Check exit code (0 = success, 1 = failure)
```

## 🎯 Benefits Over Manual Testing

### Efficiency
- **Automated Execution**: No manual Postman collection running
- **Comprehensive Coverage**: Tests all roles and permissions automatically
- **Fast Feedback**: Complete test suite runs in under 30 seconds

### Reliability
- **Consistent Environment**: Seeded data ensures reproducible tests
- **No Human Error**: Automated assertions catch issues reliably
- **Regression Detection**: Quickly identifies broken functionality

### Documentation
- **Living Documentation**: Tests serve as API usage examples
- **Permission Matrix**: Clear role-based access control validation
- **Error Scenarios**: Documents expected error responses

## 📞 Support

For issues with the testing suite:
1. Check the troubleshooting section above
2. Review test logs and error messages
3. Ensure database and environment are properly configured
4. Verify all dependencies are installed (`npm install`)

The automated testing suite replaces manual Postman testing with a comprehensive, reliable, and fast alternative that ensures your API works correctly across all user roles and scenarios.