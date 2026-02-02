# React Stock Portfolio Rebalancer

A modern React TypeScript application for calculating optimal stock purchases to rebalance your investment portfolio according to target percentages.

## Features

- **Portfolio Management**: Input current stock holdings and target allocation percentages
- **Real-time Price Fetching**: Integration with Alpha Vantage API for current stock prices
- **Smart Rebalancing Algorithm**: Uses priority queue to optimize purchase decisions within buying power constraints
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop compatibility
- **TypeScript**: Full type safety and enhanced developer experience
- **Mock Data Support**: Works with sample data when API key is not configured

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd react-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Alpha Vantage API key:
   ```
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```
   
   Get a free API key from: https://www.alphavantage.co/support/#api-key

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Basic Workflow

1. **Enter Portfolio Information**
   - Current Stock Value: Total value of your existing holdings
   - Buying Power: Available cash for new purchases
   - Total Capital: Automatically calculated (Current Value + Buying Power)

2. **Configure Stock Holdings**
   - Stock Symbol: Enter ticker symbols (e.g., AAPL, GOOGL)
   - Shares Owned: Number of shares currently held
   - Target %: Desired percentage allocation in portfolio
   - Add/Remove stocks as needed

3. **Rebalance**
   - Click "Rebalance Portfolio" to fetch current prices and calculate optimal purchases
   - Review results showing recommended share purchases for each stock

### Default Portfolio

The app comes pre-configured with a sample diversified portfolio:
- QQQ (30%) - Nasdaq 100 ETF
- VOO (20%) - S&P 500 ETF  
- VWO (15%) - Emerging Markets ETF
- FXI (20%) - China ETF
- VEA (10%) - Developed Markets ETF
- NVDA (3%) - NVIDIA Corporation
- GOOGL (2%) - Alphabet Inc.

## API Integration

### Alpha Vantage API

The application uses Alpha Vantage's Global Quote endpoint to fetch real-time stock prices. 

**API Limits (Free Tier):**
- 5 API calls per minute
- 500 API calls per day

**Mock Data Mode:**
When no API key is configured or set to 'demo', the app uses realistic mock prices for testing.

## Architecture

### Project Structure

```
src/
├── components/          # React components
│   ├── StockInput.tsx   # Individual stock entry form
│   └── ResultsTable.tsx # Rebalancing results display
├── hooks/               # Custom React hooks
│   ├── usePortfolio.ts  # Portfolio state management
│   └── useStockPrices.ts # Stock price fetching
├── services/            # Business logic services
│   ├── stockApiService.ts # API integration
│   └── rebalanceService.ts # Rebalancing algorithm
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
└── index.css            # Global styles with Tailwind
```

### Key Technologies

- **React 18+**: Modern React with hooks and functional components
- **TypeScript**: Type safety and enhanced development experience
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Alpha Vantage API**: Real-time stock price data

### Rebalancing Algorithm

The core algorithm uses a priority queue (max heap) approach:

1. **Calculate Current State**: Determine current percentage allocation for each stock
2. **Priority Ranking**: Stocks with largest gaps between current and target percentages get highest priority
3. **Optimal Purchasing**: Iteratively purchase shares for highest-priority stocks within buying power constraints
4. **Result Calculation**: Show final allocations and remaining buying power

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (not recommended)

### Environment Variables

- `REACT_APP_ALPHA_VANTAGE_API_KEY` - Your Alpha Vantage API key

### Customization

The application is designed to be easily customizable:

- **Default Stocks**: Modify `DEFAULT_STOCKS` in `usePortfolio.ts`
- **Mock Prices**: Update `mockPrices` in `stockApiService.ts`
- **Styling**: Customize Tailwind classes or add custom CSS
- **API Provider**: Replace Alpha Vantage with another stock API service

## Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Error: "API call frequency limit reached"
   - Solution: Wait 1 minute between requests or upgrade API plan

2. **Invalid Stock Symbols**
   - Error: "No price data found for symbol"
   - Solution: Verify ticker symbols are correct and traded on US exchanges

3. **Percentage Validation**
   - Error: "Stock percentages must sum to 100%"
   - Solution: Ensure target percentages add up to exactly 100%

### Performance Tips

- The app caches stock prices for 5 minutes to reduce API calls
- Use mock data mode for development and testing
- Consider upgrading to Alpha Vantage premium for higher rate limits

## Migration from Angular

This React application provides the same functionality as the original Angular version with these improvements:

- **Modern Architecture**: Functional components with hooks
- **Better Performance**: Optimized re-renders and caching
- **Enhanced UX**: Loading states, error handling, and responsive design
- **Type Safety**: Full TypeScript integration
- **Maintainability**: Cleaner code structure and separation of concerns

## License

This project is open source and available under the MIT License.