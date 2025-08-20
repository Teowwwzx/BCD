# Decentralized Supply Chain Marketplace (DSCM)

## 🌐 Team Member
- Teow Zhen Xiang (TP065563) | Task: All-mix
- Tan Wei Hao (TP065277) | Task: Buyer
- Siew Li Xing (TP059876) | Task: Seller
- Tan Yong Hao (TP066885) | Task: Admin

## 🌟 Project Overview & Importance

The Decentralized Supply Chain Marketplace (DSCM) is a revolutionary off-chain application that transforms traditional supply chain management through blockchain technology. This platform addresses critical issues in modern supply chains:

- *Transparency*: Every transaction is recorded on the blockchain, providing immutable audit trails
- *Trust*: Smart contracts eliminate intermediaries and reduce fraud
- *Efficiency*: Automated processes reduce costs and processing time
- *Global Access*: Decentralized architecture enables worldwide participation
- *Security*: Cryptographic security protects sensitive business data

### Why This Matters
Traditional supply chains suffer from opacity, inefficiency, and trust issues. Our platform leverages blockchain technology to create a transparent, secure, and efficient marketplace where suppliers, manufacturers, and buyers can interact directly with confidence.

## 🏗 Project Architecture


BCD/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── auth/           # Authentication pages (login/signup)
│   │   │   ├── cart/           # Shopping cart functionality
│   │   │   ├── checkout/       # Checkout process
│   │   │   ├── contact/        # Contact form
│   │   │   ├── profile/        # User profile management
│   │   │   ├── reset-password/ # Password reset functionality
│   │   │   └── signup/         # User registration
│   │   ├── components/         # Reusable React components
│   │   ├── contexts/           # React Context providers (Auth, etc.)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Helper functions and utilities
│   │   └── types/              # TypeScript type definitions
│   ├── public/                 # Static assets
│   └── package.json            # Frontend dependencies
├── backend/                     # Node.js/Express backend with Hardhat
│   ├── prisma/
│   │   ├── migrations/         # Database migration files
│   │   ├── schema.prisma       # Database schema definition
│   │   └── seed.js             # Database seeder script
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic and services
│   ├── contracts/              # Solidity smart contracts
│   ├── scripts/                # Deployment and utility scripts
│   └── package.json            # Backend dependencies
└── README.md                   # This comprehensive guide


## 🛠 Technology Stack

### Frontend Technologies
- *Framework*: Next.js 15.4.5 with TypeScript for type-safe development
- *Styling*: Tailwind CSS for responsive, utility-first styling
- *Blockchain Integration*: Ethers.js for Web3 wallet connectivity
- *State Management*: React Context API for global state
- *Authentication*: Custom JWT-based authentication system
- *Development Port*: http://localhost:3000

### Backend Technologies
- *Runtime*: Node.js with Express.js framework
- *Database*: PostgreSQL with Prisma ORM
- *Blockchain*: Hardhat development environment
- *Smart Contracts*: Solidity for blockchain logic
- *Development Tools*: Nodemon for auto-restart
- *API Port*: http://localhost:5000

### Blockchain Infrastructure
- *Development Framework*: Hardhat with TypeScript support
- *Smart Contract Language*: Solidity ^0.8.0
- *Local Network*: Hardhat node for testing
- *Blockchain Port*: http://localhost:8545
- *Wallet Integration*: MetaMask for user interactions

## 🚀 Latest Features & Enhancements

### Authentication System
- ✅ *Enhanced Login/Signup*: Streamlined user registration with validation
- ✅ *Direct Password Reset*: Secure password recovery without email dependency
- ✅ *Form Validation*: Real-time input validation with error handling
- ✅ *Improved UI*: Black text styling for better visibility

### Wallet Integration
- ✅ *MetaMask Connection*: Seamless Web3 wallet connectivity
- ✅ *Real-time Updates*: Live wallet balance and transaction status
- ✅ *Multi-network Support*: Configurable blockchain networks
- ✅ *Transaction History*: Complete audit trail of blockchain interactions

### User Experience
- ✅ *Shopping Cart*: Full e-commerce functionality with persistent cart
- ✅ *User Profiles*: Comprehensive profile management system
- ✅ *Responsive Design*: Mobile-first, cross-device compatibility
- ✅ *Accessibility*: Enhanced text contrast and keyboard navigation

### Security & Performance
- ✅ *Smart Contract Security*: Audited contract code with best practices
- ✅ *Data Encryption*: Secure handling of sensitive user information
- ✅ *Performance Optimization*: Lazy loading and code splitting
- ✅ *Error Handling*: Comprehensive error boundaries and logging

## 📋 Prerequisites & System Requirements

### Required Software
- *Node.js*: Version 18.0.0 or higher (LTS recommended)
- *npm*: Version 8.0.0 or higher (comes with Node.js)
- *Git*: Latest version for version control
- *MetaMask*: Browser extension for Web3 interactions

### Recommended Development Tools
- *VS Code*: With TypeScript and Solidity extensions
- *PostgreSQL*: Version 14+ for database (if using external DB)
- *Postman*: For API testing and development

### System Requirements
- *RAM*: Minimum 8GB (16GB recommended)
- *Storage*: At least 2GB free space
- *OS*: Windows 10+, macOS 10.15+, or Linux Ubuntu 18.04+

## 🔧 Detailed Installation & Setup Guide

### Step 1: Repository Setup
bash
# Clone the repository
git clone <repository-url>
cd BCD

# Verify Node.js installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v8.0.0 or higher

*Why this matters*: Proper version control ensures all team members work with the same codebase, and version verification prevents compatibility issues.

### Step 2: Backend Environment Setup
bash
# Navigate to backend directory
cd backend

# Install all backend dependencies
npm install

# This installs:
# - Express.js for API server
# - Hardhat for blockchain development
# - Prisma for database management
# - Security and validation libraries

*Critical importance*: The backend serves as the bridge between the frontend and blockchain, handling user authentication, data persistence, and smart contract interactions.

### Step 3: Frontend Environment Setup
bash
# Navigate to frontend directory (from project root)
cd frontend

# Install all frontend dependencies
npm install

# This installs:
# - Next.js framework and React
# - Tailwind CSS for styling
# - Ethers.js for blockchain connectivity
# - TypeScript for type safety

*Why this step is essential*: The frontend provides the user interface for interacting with the decentralized marketplace, including wallet connections and transaction management.

### Step 4: Environment Configuration
bash
# In the backend directory, create environment file
cp .env.example .env

# Edit .env file with your configuration:
# PORT=5000
# NODE_ENV=development
# DATABASE_URL="postgresql://username:password@localhost:5432/dscm_db"
# HARDHAT_NETWORK=localhost
# FRONTEND_URL=http://localhost:3000

*Security note*: Environment variables protect sensitive configuration data and allow different settings for development, testing, and production environments.

## 🚀 Running the Application (Step-by-Step)

### Terminal 1: Blockchain Network
bash
cd backend
npm run hardhat:node

*What this does*: 
- Starts a local Ethereum blockchain network
- Creates 20 pre-funded test accounts with 10,000 ETH each
- Provides a clean, isolated environment for development
- *Critical*: This must run continuously during development

*Expected output*: You'll see account addresses and private keys displayed. Keep this terminal open!

### Terminal 2: Smart Contract Deployment
bash
cd backend
npm run hardhat:deploy

*Purpose*: 
- Compiles Solidity smart contracts
- Deploys contracts to the local blockchain
- Generates contract addresses and ABIs
- *Essential*: Contracts must be deployed before frontend can interact with blockchain

*Success indicators*: Look for "Contract deployed to:" messages with addresses.

### Terminal 3: Backend API Server
bash
cd backend
npm run dev

*Functionality*:
- Starts the Express.js API server on port 5000
- Enables database connections and API endpoints
- Provides authentication and data management services
- *Monitoring*: Watch for "Server running on port 5000" message

### Terminal 4: Frontend Development Server
bash
cd frontend
npm run dev

*What happens*:
- Starts Next.js development server on port 3000
- Enables hot reloading for instant code changes
- Serves the user interface and handles routing
- *Access point*: Open http://localhost:3000 in your browser

## 🎯 Application Features & Usage

### User Authentication
- *Registration*: Create new accounts with email and password
- *Login*: Secure authentication with session management
- *Password Reset*: Self-service password recovery
- *Profile Management*: Update personal information and preferences

### Wallet Integration
- *MetaMask Connection*: Link your Web3 wallet to the platform
- *Balance Display*: Real-time cryptocurrency balance updates
- *Transaction Signing*: Secure blockchain transaction approval
- *Network Switching*: Support for multiple blockchain networks

### Marketplace Functions
- *Product Browsing*: Explore available supply chain products
- *Shopping Cart*: Add items and manage quantities
- *Checkout Process*: Complete purchases with blockchain payments
- *Order Tracking*: Monitor transaction status and delivery

### Smart Contract Interactions
- *Transparent Transactions*: All trades recorded on blockchain
- *Automated Escrow*: Smart contracts hold funds until delivery
- *Dispute Resolution*: Decentralized arbitration mechanisms
- *Supply Chain Tracking*: End-to-end product journey visibility

## 📜 Available Scripts & Commands

### Backend Scripts
bash
npm start              # Production server startup
npm run dev            # Development server with auto-restart
npm run hardhat:compile # Compile smart contracts
npm run hardhat:test   # Run contract unit tests
npm run hardhat:node   # Start local blockchain
npm run hardhat:deploy # Deploy contracts to network
npm run db:seed        # Populate database with sample data
npm run db:migrate     # Run database migrations
npm run test           # Run backend API tests


### Frontend Scripts
bash
npm run dev            # Development server with hot reload
npm run build          # Production build optimization
npm run start          # Serve production build
npm run lint           # Code quality and style checking
npm run type-check     # TypeScript type validation
npm run test           # Run frontend component tests


## 🗄 Database Setup & Management

### Initial Database Setup
bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed with sample data
npm run db:seed


### Database Schema Overview
- *Users*: Authentication and profile information
- *Products*: Supply chain items and metadata
- *Orders*: Transaction records and status
- *Wallets*: Blockchain address associations
- *Transactions*: Blockchain transaction history

## 🔒 Security Considerations

### Development Security
- *Private Keys*: Never commit private keys to version control
- *Environment Variables*: Use .env files for sensitive configuration
- *HTTPS*: Always use HTTPS in production environments
- *Input Validation*: All user inputs are validated and sanitized

### Blockchain Security
- *Smart Contract Audits*: Contracts follow security best practices
- *Reentrancy Protection*: Guards against common attack vectors
- *Access Controls*: Role-based permissions for sensitive functions
- *Gas Optimization*: Efficient contract execution to minimize costs

### API Security
- *Authentication*: JWT tokens for secure API access
- *Rate Limiting*: Protection against abuse and DDoS attacks
- *CORS Configuration*: Controlled cross-origin resource sharing
- *Data Encryption*: Sensitive data encrypted at rest and in transit

## 🛠 Development Workflow

### Best Practices
1. *Version Control*: Use feature branches for new development
2. *Code Quality*: Run linting and type checking before commits
3. *Testing*: Write unit tests for new features
4. *Documentation*: Update README for significant changes
5. *Security*: Regular dependency updates and security audits

### Development Cycle
1. Start all required services (blockchain, backend, frontend)
2. Make code changes with hot reloading
3. Test functionality in browser and with API tools
4. Run test suites to ensure no regressions
5. Commit changes with descriptive messages

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### "Port already in use" Error
bash
# Find and kill process using the port
lsof -ti:3001 | xargs kill -9  # For frontend
lsof -ti:5000 | xargs kill -9  # For backend
lsof -ti:8545 | xargs kill -9  # For blockchain


#### MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Switch to the correct network (localhost:8545)
- Import test accounts using private keys from Hardhat node
- Clear browser cache and reload the page

#### Database Connection Problems
bash
# Reset database
npx prisma migrate reset
npx prisma generate
npm run db:seed


#### Smart Contract Deployment Failures
bash
# Clean and redeploy
npx hardhat clean
npx hardhat compile
npm run hardhat:deploy


#### Frontend Build Errors
bash
# Clear Next.js cache
rm -rf .next
npm run build


### Getting Help
- Check console logs for detailed error messages
- Verify all services are running on correct ports
- Ensure environment variables are properly configured
- Review network connectivity and firewall settings

## 🌐 API Documentation

### Authentication Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User authentication
- POST /api/auth/logout - Session termination
- POST /api/auth/reset-password - Password reset

### User Management
- GET /api/user/profile - Get user profile
- PUT /api/user/profile - Update user profile
- GET /api/user/wallet - Get wallet information
- PUT /api/user/wallet - Update wallet address

### Marketplace APIs
- GET /api/products - List all products
- GET /api/products/:id - Get product details
- POST /api/orders - Create new order
- GET /api/orders - Get user orders

### Health & Status
- GET /api/health - API health check
- GET /api/status - System status information

## 🚀 Deployment Guide

### Production Deployment
1. *Environment Setup*: Configure production environment variables
2. *Database*: Set up production PostgreSQL database
3. *Blockchain*: Deploy to mainnet or testnet
4. *Frontend*: Build and deploy to hosting service
5. *Backend*: Deploy API server with proper security

### Environment Variables for Production
bash
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:password@prod_host:5432/prod_db
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your-secure-jwt-secret
HARDHAT_NETWORK=mainnet


## 🤝 Contributing Guidelines

### Development Process
1. *Fork the repository* and create a feature branch
2. *Follow coding standards* and maintain consistent style
3. *Write comprehensive tests* for new functionality
4. *Update documentation* for any API or feature changes
5. *Submit pull request* with detailed description

### Code Standards
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Include unit tests for new features
- Document complex functions and components

## 📄 License

ISC License - See LICENSE file for details

## 📞 Support & Contact

For technical support, feature requests, or contributions:
- Create an issue in the GitHub repository
- Follow the contributing guidelines
- Join our development community discussions

---

*Built with ❤ for the future of decentralized commerce*