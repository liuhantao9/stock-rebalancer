# Stock Rebalancer

A modern React TypeScript application for calculating optimal stock purchases to rebalance your investment portfolio according to target percentages.

## Features

- **Portfolio Management**: Input current stock holdings and target allocation percentages
- **Real-time Price Fetching**: Integration with Finnhub API for current stock prices
- **Smart Rebalancing Algorithm**: Multiple optimization strategies (Hybrid/Greedy/Proportional)
- **User Authentication**: Sign-in/sign-up with portfolio persistence
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

```bash
cd react-app
npm install
```

### Configure API Key

```bash
cp .env.example .env
# Edit .env and add your Finnhub API key
```

Get a free API key from: https://finnhub.io/

### Run Development Server

```bash
npm start
```

Navigate to `http://localhost:3000`

## Usage

1. Sign in or create an account
2. Enter your buying power and current stock holdings
3. Set target percentage allocations for each stock
4. Click "Rebalance Portfolio" to calculate optimal purchases

## Project Structure

```
react-app/
├── src/
│   ├── components/     # React UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic & API services
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
└── package.json        # Dependencies
```

## License

MIT License
