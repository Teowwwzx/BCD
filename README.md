# Decentralized Supply Chain Marketplace (DSCM)

A hybrid on-chain/off-chain application for transparent and efficient supply chain transactions.

## Project Structure

```
BCD/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/ # Reusable React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── contexts/  # React Context providers
│   │   └── lib/       # Helper functions and utilities
│   │   ├── types/index.ts     # TypeScript type definitions
│   └── ...
├── backend/           # Node.js/Express backend with Hardhat
│   ├── prisma/
│   │   ├── migrations/ # Database migration files
│   │   ├── schema.prisma # Prisma schema for database models
│   │   └── seed.js    # Database seeder script
│   ├── routes/      # API route definitions
│   ├── services/    # Business logic and services
│   └── ...
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

#### 2. Deploy the Smart Contracts (Terminal 2)
```bash
cd backend
npm run hardhat:deploy
```
This will compile the smart contracts and deploy them to the local Hardhat network.

#### 3. Start the Backend Server (Terminal 2)
```bash
cd backend
npm run dev
```
Backend API will be available at http://localhost:5000

#### 4. Start the Frontend (Terminal 3)
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
- `npm run db:seed` - Seed the database with initial data

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /` - API status
- `GET /api/health` - Health check

### Database Seeding

To populate the database with initial data, run the following command:

```bash
cd backend
npm run db:seed
```

This will execute the `prisma/seed.js` script, which populates the database with sample users, products, and other necessary data.

## Environment Configuration

The backend uses environment variables defined in `.env`:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode
- `DATABASE_URL` - PostgreSQL connection string
- `HARDHAT_NETWORK` - Blockchain network
- `FRONTEND_URL` - CORS configuration


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