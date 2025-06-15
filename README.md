# Potluck

A decentralized potluck coordination platform built with Farcaster frames and smart contracts.

## How It Works

Potluck is inspired by traditional community savings circles like **susus** (West African) and **tandas** (Latin American) - time-tested financial cooperation systems that help communities pool resources and support each other.

### The Game
- **Group Formation**: A group of users agrees to contribute the same amount every time period (daily, weekly, or monthly)
- **Regular Contributions**: Each participant contributes their agreed amount during every cycle
- **Winner Selection**: One participant is selected as the winner for each cycle and receives the entire pot
- **Rotation**: The process continues until everyone has had a turn to win

### The Benefits
- **Honesty System**: If everyone plays consistently through all cycles, everyone breaks even - you get back exactly what you put in
- **Forced Savings**: Creates accountability and discipline for regular saving
- **Larger Purchases**: Enables bigger purchases that would be difficult when saving paycheck-to-paycheck
- **Community Support**: Builds financial solidarity and trust within groups
- **Access to Capital**: Provides access to lump sums without traditional banking or credit requirements

### Example
*8 friends each contribute $100 weekly. Each week, one person receives $800. After 8 weeks, everyone has contributed $800 and received $800 - but each person had guaranteed access to one bulk $800 surplus, that they wouldn't have been able to save for otherwise.*

## Project Structure

This is a monorepo containing two main packages:

### 📱 Farcaster Mini App (`packages/farcaster-mini-app`)
The frontend application built as a Farcaster Mini App (formerly Frames). This package contains:
- **Next.js + TypeScript + React** application
- **Farcaster frame integration** for social interactions
- **Account association management** for different environments
- **Frame metadata and manifest generation**
- **UI components** for potluck creation and management

**Key Features:**
- Create and join potlucks through Farcaster
- Multi-environment support (dev, prod, staging)
- Frame-based social interactions
- Responsive web interface

### 🔗 Smart Contracts (`packages/contracts`)
The blockchain infrastructure powering the potluck coordination logic. This package contains:
- **Solidity smart contracts** for potluck management
- **Foundry framework** for testing and deployment
- **Contract deployment scripts**
- **Testing infrastructure**

**Key Features:**
- Decentralized potluck coordination
- Trustless participation and contribution tracking
- Gas-efficient contract design
- Comprehensive test coverage

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd potluck

# Install dependencies for all packages
npm install

# Install dependencies for specific packages
cd packages/farcaster-mini-app && npm install
cd packages/contracts && npm install
```

### Development

#### Running the Farcaster Mini App
```bash
cd packages/farcaster-mini-app
npm run dev
```

#### Working with Smart Contracts
```bash
cd packages/contracts
# Run tests
forge test

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url <your-rpc-url>
```

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

[Add your license information here]
