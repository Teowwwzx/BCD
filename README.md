# Decentralized Supply Chain Marketplace (DSCM)

A hybrid on-chain/off-chain application for transparent and efficient supply chain transactions.

## Project Structure

```
BCD/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js/Express backend with Hardhat
└── README.md         # This file
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.4.5 with TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Ethers.js for Web3 integration
- **Port**: http://localhost:3000

### Backend
- **Runtime**: Node.js with Express.js
- **Blockchain**: Hardhat with Solidity
- **Development**: Nodemon for auto-restart
- **Port**: http://localhost:5000

### Blockchain
- **Framework**: Hardhat
- **Language**: Solidity (TypeScript project)
- **Network**: Local Hardhat node
- **Port**: http://localhost:8545

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BCD
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

### Running the Application

#### 1. Start the Hardhat Blockchain (Terminal 1)
```bash
cd backend
npm run hardhat:node
```
This will start a local Ethereum network with 20 pre-funded accounts.

#### 2. Start the Backend Server (Terminal 2)
```bash
cd backend
npm run dev
```
Backend API will be available at http://localhost:5000

#### 3. Start the Frontend (Terminal 3)
```bash
cd frontend
npm run dev
```
Frontend will be available at http://localhost:3000

## Available Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run hardhat:compile` - Compile Solidity contracts
- `npm run hardhat:test` - Run contract tests
- `npm run hardhat:node` - Start local blockchain
- `npm run hardhat:deploy` - Deploy contracts to local network

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /` - API status
- `GET /api/health` - Health check

## Environment Configuration

The backend uses environment variables defined in `.env`:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode
- `DATABASE_URL` - PostgreSQL connection string
- `HARDHAT_NETWORK` - Blockchain network
- `FRONTEND_URL` - CORS configuration

## Development Status

✅ **Phase 1 Complete**: Core Foundation
- [x] Project structure setup
- [x] Next.js frontend initialized
- [x] Express.js backend initialized
- [x] Hardhat blockchain environment
- [x] Basic API endpoints
- [x] Development servers running

🚧 **Next Steps**: 
- User authentication system
- Database integration (Neon PostgreSQL)
- Smart contract development
- Frontend UI components

## Blockchain Accounts

When running the local Hardhat node, you'll have access to 20 pre-funded accounts with 10,000 ETH each. The private keys are displayed in the terminal for testing purposes.

⚠️ **Warning**: These accounts are for development only. Never use these private keys on mainnet or any live network.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC License