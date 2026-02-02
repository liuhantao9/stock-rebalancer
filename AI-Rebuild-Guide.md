# AI-Guided Project Rebuild Guide
## How to Guide an AI to Build a Stock Portfolio Rebalancer Application

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Pre-requisites & Setup](#2-pre-requisites--setup)
3. [Phase 1: Project Initialization](#3-phase-1-project-initialization)
4. [Phase 2: Type Definitions](#4-phase-2-type-definitions)
5. [Phase 3: Core Services](#5-phase-3-core-services)
6. [Phase 4: Custom Hooks](#6-phase-4-custom-hooks)
7. [Phase 5: UI Components](#7-phase-5-ui-components)
8. [Phase 6: Main Application](#8-phase-6-main-application)
9. [Phase 7: Styling & Polish](#9-phase-7-styling--polish)
10. [Phase 8: Testing & Debugging](#10-phase-8-testing--debugging)
11. [Prompt Templates](#11-prompt-templates)
12. [Best Practices for AI Collaboration](#12-best-practices-for-ai-collaboration)

---

## 1. Introduction

This guide provides a structured approach for using AI assistants (like Claude, ChatGPT, or GitHub Copilot) to rebuild a Stock Portfolio Rebalancer application. The application helps investors calculate optimal stock purchases to maintain target portfolio allocations.

### What You'll Build

- A React TypeScript web application
- Real-time stock price integration via Finnhub API
- Multiple rebalancing algorithms (Greedy, Proportional, Hybrid)
- User authentication and portfolio persistence
- Responsive UI with Tailwind CSS

### Key Principles

1. **Break down complex tasks** into smaller, manageable prompts
2. **Provide context** at each step
3. **Review and iterate** on AI-generated code
4. **Test incrementally** before moving to the next phase

---

## 2. Pre-requisites & Setup

### Technical Requirements

- Node.js (v16 or higher)
- npm or yarn package manager
- A code editor (VS Code recommended)
- Git for version control
- Finnhub API key (free tier available at https://finnhub.io/)

### Initial Prompt to AI

```
I want to create a React TypeScript application for stock portfolio
rebalancing. The app should:

1. Allow users to input their current stock holdings
2. Fetch real-time stock prices from Finnhub API
3. Calculate optimal purchases to rebalance according to target percentages
4. Support multiple rebalancing strategies
5. Save portfolios to browser localStorage
6. Have user authentication

Please help me set up the initial project structure using Create React App
with TypeScript and Tailwind CSS.
```

---

## 3. Phase 1: Project Initialization

### Step 1.1: Create React App

**Prompt:**
```
Create a new React application with TypeScript template using Create React App.
Then configure Tailwind CSS for styling. Show me the exact commands and
configuration files needed.
```

**Expected Output:**
- `npx create-react-app stock-rebalancer --template typescript`
- Tailwind CSS installation and configuration
- PostCSS configuration
- Updated `index.css` with Tailwind directives

### Step 1.2: Project Structure

**Prompt:**
```
Set up the following folder structure for our stock rebalancer app:

src/
├── components/     # React UI components
├── hooks/          # Custom React hooks
├── services/       # Business logic and API calls
├── types/          # TypeScript type definitions
├── App.tsx         # Main application
└── index.tsx       # Entry point

Create placeholder files for each folder with appropriate exports.
```

### Step 1.3: Environment Configuration

**Prompt:**
```
Create environment configuration for the Finnhub API key:
1. Create a .env.example file with placeholder
2. Add .env to .gitignore
3. Show how to access the environment variable in React
```

---

## 4. Phase 2: Type Definitions

### Step 2.1: Core Types

**Prompt:**
```
Create TypeScript interfaces for a stock portfolio rebalancer in types/index.ts:

1. StockInput - User input for a stock (symbol, shares, targetPercentage)
2. Stock - Rebalancing result (includes sharesToBuy, investmentAmount, etc.)
3. PortfolioData - Complete portfolio state
4. RebalanceResult - Algorithm output with stocks array and remaining cash
5. RebalanceOptions - Algorithm configuration (strategy, fractionalShares, etc.)
6. PortfolioAnalysis - Metrics like totalDeviation, utilizationRate

Make sure to include:
- Current values calculated from live prices
- Percentage calculations (current%, target%, result%)
- Support for multiple strategies: 'greedy', 'proportional', 'hybrid'
```

### Step 2.2: Auth & Storage Types

**Prompt:**
```
Add TypeScript interfaces for authentication and storage:

1. User - id, email, displayName, createdAt
2. AuthState - user, isAuthenticated, loading, error
3. SavedPortfolio - id, name, description, stocks, createdAt, updatedAt
4. UserPreferences - defaultBuyingPower, fractionalShares, etc.

Export all types from types/index.ts
```

---

## 5. Phase 3: Core Services

### Step 3.1: Stock API Service

**Prompt:**
```
Create stockApiService.ts that integrates with Finnhub API:

Requirements:
1. Singleton pattern for the service instance
2. Fetch stock quotes using endpoint:
   https://finnhub.io/api/v1/quote?symbol={SYMBOL}&token={API_KEY}
3. Implement 5-minute client-side caching to reduce API calls
4. Rate limiting: 200ms between requests, 1s between batches of 5 stocks
5. Batch processing for multiple stock symbols
6. Error handling for 401 (invalid key) and 429 (rate limit) errors
7. Methods: getPrice(symbol), getPrices(symbols[]), clearCache(), getStats()

The quote response has: c (current price), o (open), h (high), l (low)
Use the 'c' field for current price.
```

### Step 3.2: Basic Rebalancing Service

**Prompt:**
```
Create rebalanceService.ts with a basic rebalancing algorithm:

Requirements:
1. PriorityQueue class using max heap for stock prioritization
2. calculateRebalance(stocks, buyingPower, options) function
3. Greedy algorithm: always buy the most underweight stock first
4. Validate that target percentages sum to 100%
5. Calculate shares to buy based on current prices
6. Return RebalanceResult with updated stocks and remainingCash

Priority calculation should consider:
- Percentage gap from target
- Dollar gap from target
- Affordability (can we buy at least 1 share?)
```

### Step 3.3: Advanced Rebalancing Service

**Prompt:**
```
Create advancedRebalanceService.ts with sophisticated rebalancing:

Implement three strategies:

1. GREEDY: Always buy most underweight stock
   - Simple priority-based allocation
   - Good for concentrated portfolios

2. PROPORTIONAL: Distribute proportionally to gaps
   - Calculate gap weights
   - Two-pass allocation for overflow handling

3. HYBRID (default): Combines both approaches
   - Phase 1: Allocate 70% proportionally to stocks with >2% gaps
   - Phase 2: Use remaining 30% with greedy approach
   - Phase 3: Aggressive cash utilization (use remaining <$1)

Additional requirements:
- AdvancedPriorityQueue with binary search insertion
- Multi-factor priority: |percentDiff|*10 + dollarGap/1000 + affordability
- Portfolio analysis: totalDeviation, utilizationRate, maxDeviation
- Input validation: duplicates, valid percentages, price availability
- Support for fractional shares option
- Minimum trade amount configuration
```

### Step 3.4: Authentication Service

**Prompt:**
```
Create authService.ts for user authentication using localStorage:

Requirements:
1. User registration with email/password validation
   - Email format validation
   - Password minimum length (6 characters)
   - Unique email check
2. Sign in with credential verification
3. Session management with 7-day expiration tokens
4. Store users in localStorage key: 'stock-rebalancer-auth'
5. Simple password hashing (note: not production-grade)
6. Methods: signUp, signIn, signOut, getCurrentUser, updateProfile

Session structure:
- userId, token, expiresAt
- Auto-cleanup of expired sessions
```

### Step 3.5: User Storage Service

**Prompt:**
```
Create userStorageService.ts for portfolio persistence:

Requirements:
1. Portfolio CRUD operations (create, read, update, delete)
2. Per-user isolated storage using: 'stock-rebalancer-user-{userId}'
3. Auto-save with dirty tracking
4. Portfolio metadata: id, name, description, tags, timestamps
5. Duplicate portfolio functionality
6. Import/export as JSON
7. Storage statistics (count, total size)
8. Deep cloning for data integrity

Methods needed:
- savePortfolio(userId, portfolio)
- loadPortfolio(userId, portfolioId)
- listPortfolios(userId)
- deletePortfolio(userId, portfolioId)
- duplicatePortfolio(userId, portfolioId, newName)
- exportData(userId) / importData(userId, jsonData)
```

---

## 6. Phase 4: Custom Hooks

### Step 4.1: Portfolio Hook

**Prompt:**
```
Create usePortfolio.ts custom hook for portfolio state management:

State to manage:
- stocks: StockInput[] (the portfolio holdings)
- buyingPower: number
- currentStockValue: number (auto-calculated)
- totalCapital: number (auto-calculated)
- hasUnsavedChanges: boolean

Functions to expose:
- addStock() - add new empty stock entry
- removeStock(index) - remove stock (min 1 required)
- updateStock(index, field, value) - update any stock field
- setBuyingPower(amount)
- calculateRebalance(options, prices) - trigger calculation
- resetPortfolio() - clear to defaults

Auto-calculations:
- currentStockValue = sum of (shares * price) for all stocks
- totalCapital = currentStockValue + buyingPower
- Validate percentages sum to 100
```

### Step 4.2: Auth Hook

**Prompt:**
```
Create useAuth.ts custom hook wrapping authService:

State:
- user: User | null
- isAuthenticated: boolean
- loading: boolean
- error: string | null

Functions:
- signIn(email, password)
- signUp(email, password, displayName)
- signOut()
- updateProfile(updates)
- clearError()

On mount: check for existing session and restore user
Handle errors gracefully and expose via error state
```

### Step 4.3: Stock Prices Hook

**Prompt:**
```
Create useStockPrices.ts for fetching and caching stock prices:

State:
- prices: Map<string, number> (symbol -> price)
- loading: boolean
- error: string | null

Functions:
- fetchPrices(symbols[]) - fetch prices for given symbols
- getPrice(symbol) - get cached price
- refreshAll() - refresh all cached prices

Features:
- Batch fetching using stockApiService
- Loading states per symbol or global
- Error handling with user-friendly messages
```

### Step 4.4: User Storage Hook

**Prompt:**
```
Create useUserStorage.ts for portfolio persistence:

State:
- portfolios: SavedPortfolio[]
- currentPortfolioId: string | null
- preferences: UserPreferences
- storageStats: { count, totalSize }

Functions:
- savePortfolio(portfolioData, name, description?)
- loadPortfolio(portfolioId)
- deletePortfolio(portfolioId)
- duplicatePortfolio(portfolioId)
- updatePreferences(updates)
- importFromJson(jsonString)
- exportToJson()

Auto-refresh portfolio list when changes occur
```

---

## 7. Phase 5: UI Components

### Step 5.1: Stock Input Component

**Prompt:**
```
Create StockInput.tsx component for entering individual stocks:

Props:
- stock: StockInput
- index: number
- currentPrice: number | null
- onChange: (index, field, value) => void
- onRemove: (index) => void
- canRemove: boolean

UI elements (grid layout):
1. Stock symbol input (auto-uppercase, max 5 chars)
2. Shares owned input (number, min 0)
3. Current value (disabled, calculated: shares * price)
4. Target percentage input (number, 0-100)
5. Remove button (X icon, disabled if canRemove=false)

Styling: Use Tailwind CSS with responsive grid
Show loading state when price is null
Format currency values with $ and commas
```

### Step 5.2: Results Panel Component

**Prompt:**
```
Create ResultsPanel.tsx as a sliding side panel:

Props:
- isOpen: boolean
- onClose: () => void
- results: RebalanceResult | EnhancedRebalanceResult
- isEnhanced: boolean

Features:
1. Slide-in animation from right side
2. Backdrop overlay with click-to-close
3. Close button in header
4. Conditional rendering: EnhancedResultsTable or basic ResultsTable
5. Summary stats at top (total invested, remaining cash, utilization)

Animation: Use CSS transitions (transform, opacity)
Width: 80% on mobile, 600px on desktop
```

### Step 5.3: Enhanced Results Table

**Prompt:**
```
Create EnhancedResultsTable.tsx for detailed results display:

Props:
- results: EnhancedRebalanceResult

Sections:

1. Portfolio Analysis Cards (3 columns):
   - Total Deviation (red if >5%, yellow if >2%, green otherwise)
   - Utilization Rate (percentage of buying power used)
   - Max Deviation (largest single stock gap)

2. Recommendations Panel:
   - List optimization suggestions from results.analysis
   - Icon-coded by severity

3. Results Table with columns:
   - Stock Symbol
   - Current Price
   - Current Value (before)
   - Shares to Buy
   - Investment Amount
   - New Value (after)
   - Current % / Target % / Result %
   - Gap from Target

Color-code gaps: red for underweight, green for on-target
Format all currency and percentage values appropriately
```

### Step 5.4: Rebalance Options Component

**Prompt:**
```
Create RebalanceOptions.tsx for algorithm configuration:

Props:
- options: RebalanceOptions
- onChange: (options) => void

Form elements:

1. Strategy Dropdown:
   - Greedy: "Always buy most underweight"
   - Proportional: "Distribute by gap size"
   - Hybrid: "Smart combination (recommended)"

2. Fractional Shares Toggle:
   - Switch/checkbox
   - Helper text explaining the option

3. Minimum Trade Amount:
   - Number input, default $10
   - "Skip trades smaller than this amount"

4. Tolerance Percentage:
   - Number input, default 0.5%
   - "Acceptable deviation from target"

5. Max Iterations:
   - Number input, default 1000
   - "Algorithm iteration limit"

Collapsible panel with "Advanced Options" header
```

### Step 5.5: Portfolio Manager Component

**Prompt:**
```
Create PortfolioManager.tsx for saving/loading portfolios:

Props:
- portfolios: SavedPortfolio[]
- currentId: string | null
- onSave: (name, description) => void
- onLoad: (portfolioId) => void
- onDelete: (portfolioId) => void
- onDuplicate: (portfolioId) => void

UI Sections:

1. Save Section:
   - "Save Current Portfolio" button
   - Modal with name input (required) and description textarea

2. Portfolio List:
   - Card for each saved portfolio
   - Show: name, description (truncated), last updated
   - Actions: Load, Duplicate, Delete (with confirmation)
   - Highlight current portfolio

3. Empty State:
   - Friendly message when no portfolios saved
   - Prompt to save first portfolio

Styling: Modal overlays, card grid, hover states
```

### Step 5.6: Auth Form Component

**Prompt:**
```
Create AuthForm.tsx for sign in/sign up:

State:
- mode: 'signin' | 'signup'
- email, password, displayName inputs
- loading, error states

Sign In Form:
- Email input with validation
- Password input (type="password")
- Sign In button
- "Don't have an account? Sign up" link

Sign Up Form:
- Display name input
- Email input with validation
- Password input with requirements shown
- Confirm password input
- Sign Up button
- "Already have an account? Sign in" link

Features:
- Form validation before submit
- Error display below form
- Loading spinner on submit
- Auto-focus first field
```

---

## 8. Phase 6: Main Application

### Step 6.1: App Component

**Prompt:**
```
Create the main App.tsx that orchestrates everything:

Structure:

1. Authentication Check:
   - If not authenticated, show AuthForm
   - If authenticated, show main app

2. Header:
   - App title "Stock Rebalancer"
   - User info and Sign Out button
   - Portfolio name (if loaded)

3. Portfolio Setup Section:
   - Current stock value (calculated)
   - Buying power input
   - Total capital (calculated)
   - Fetch prices button

4. Stock Inputs Section:
   - Grid of StockInput components
   - Add Stock button
   - Show current prices next to symbols

5. Options Section:
   - RebalanceOptions component
   - Toggle between basic/advanced mode

6. Action Buttons:
   - "Calculate Rebalance" button (primary)
   - "Manage Portfolios" button (secondary)

7. Results Panel:
   - ResultsPanel component (slides in when results ready)

8. Portfolio Manager:
   - Modal triggered by Manage Portfolios button

State management:
- Use all custom hooks (useAuth, usePortfolio, useStockPrices, useUserStorage)
- Results caching (5 minute TTL)
- Loading states for API calls
- Error handling with toast/alert messages
```

### Step 6.2: App Layout

**Prompt:**
```
Implement the responsive layout for App.tsx:

Mobile (< 640px):
- Single column layout
- Full-width inputs
- Stacked sections
- Results panel full width

Tablet (640px - 1024px):
- Two column grid for stock inputs
- Side-by-side for some form elements

Desktop (> 1024px):
- Three column grid for stock inputs
- Max width container (1280px)
- Fixed position results panel

Use Tailwind responsive prefixes: sm:, md:, lg:, xl:
Add proper spacing (padding, margins, gaps)
Ensure touch-friendly input sizes on mobile
```

---

## 9. Phase 7: Styling & Polish

### Step 7.1: Design System

**Prompt:**
```
Define a consistent design system using Tailwind CSS:

Colors:
- Primary: Blue (#3B82F6) - buttons, links, focus states
- Success: Green (#10B981) - positive numbers, confirmations
- Warning: Orange (#F59E0B) - warnings, moderate deviations
- Danger: Red (#EF4444) - errors, negative gaps, delete actions
- Neutral: Gray scale for text, borders, backgrounds

Typography:
- Headings: font-bold, appropriate sizes (text-2xl, text-xl, etc.)
- Body: text-gray-700 for primary, text-gray-500 for secondary
- Numbers: font-mono for financial values

Components:
- Buttons: rounded-md, px-4 py-2, hover/focus states
- Inputs: border border-gray-300, rounded-md, focus:ring-2
- Cards: bg-white, shadow-md, rounded-lg, p-4
- Modals: fixed inset-0, bg-black/50 backdrop, centered content
```

### Step 7.2: Animations & Transitions

**Prompt:**
```
Add smooth animations and transitions:

1. Results Panel:
   - Slide in from right: transform translateX(100%) -> translateX(0)
   - Duration: 300ms ease-out
   - Backdrop fade: opacity 0 -> 0.5

2. Loading States:
   - Spinner animation for buttons
   - Skeleton placeholders for prices
   - Pulse animation for loading cards

3. Interactions:
   - Button hover: slight scale up (1.02)
   - Card hover: shadow increase
   - Input focus: ring and border color change

4. Notifications:
   - Toast slide up from bottom
   - Auto-dismiss after 3 seconds
   - Exit animation slide down

Use Tailwind's transition classes and custom @keyframes if needed
```

---

## 10. Phase 8: Testing & Debugging

### Step 8.1: Algorithm Testing

**Prompt:**
```
Create test scripts for the rebalancing algorithms:

test-rebalance.js:
- Test cases for greedy strategy
- Test cases for proportional strategy
- Test cases for hybrid strategy
- Edge cases:
  - All stocks at target
  - Single underweight stock
  - Not enough buying power for any purchase
  - Exact amount available for perfect allocation

Verify:
- Percentages after rebalance are closer to targets
- Cash utilization is maximized
- No negative shares
- Fractional shares work correctly when enabled

Output: console log with pass/fail for each test
```

### Step 8.2: API Debug Panel

**Prompt:**
```
Create ApiDebugPanel.tsx for testing the stock API:

Features:
1. API Connection Test:
   - Button to test API key validity
   - Show success/error message

2. Price Fetch Test:
   - Input for stock symbol
   - Fetch button
   - Display returned price and full response

3. Cache Statistics:
   - Show number of cached symbols
   - Cache hit rate
   - Last cache clear time

4. Clear Cache Button:
   - Force refresh all prices

5. Rate Limit Status:
   - Show requests made in last minute
   - Time until rate limit resets

Only show in development mode (process.env.NODE_ENV === 'development')
```

### Step 8.3: Error Handling

**Prompt:**
```
Implement comprehensive error handling throughout the app:

API Errors:
- 401: "Invalid API key - check your configuration"
- 429: "Rate limit exceeded - please wait and try again"
- Network error: "Unable to connect - check your internet"
- Unknown: "Something went wrong - please try again"

Validation Errors:
- Percentages don't sum to 100: "Target percentages must total 100%"
- Duplicate symbols: "Duplicate stock symbol: {symbol}"
- Invalid inputs: Specific field validation messages

Auth Errors:
- Invalid credentials: "Email or password is incorrect"
- Email taken: "An account with this email already exists"
- Weak password: "Password must be at least 6 characters"

Display errors:
- Inline for form fields
- Toast notifications for async operations
- Error boundary for React crashes

Add retry logic for transient failures (network, rate limits)
```

---

## 11. Prompt Templates

### Quick Reference Prompts

**For Bug Fixes:**
```
I'm getting this error in my stock rebalancer app:
[paste error message]

The error occurs when [describe action].

Here's the relevant code:
[paste code snippet]

Please help me fix this bug.
```

**For New Features:**
```
I want to add [feature name] to my stock rebalancer app.

Current behavior: [describe what exists]
Desired behavior: [describe what you want]

The feature should:
1. [requirement 1]
2. [requirement 2]
3. [requirement 3]

Please provide the implementation with TypeScript types.
```

**For Code Review:**
```
Please review this code for my stock rebalancer:

[paste code]

Check for:
1. TypeScript best practices
2. React hooks rules
3. Performance issues
4. Security vulnerabilities
5. Edge cases
```

**For Refactoring:**
```
I want to refactor this component/function:

[paste code]

Goals:
- Improve readability
- Better separation of concerns
- More reusable
- Maintain existing functionality

Please provide the refactored version with explanations.
```

---

## 12. Best Practices for AI Collaboration

### Do's

1. **Be Specific**: Include exact requirements, types, and constraints
2. **Provide Context**: Share relevant existing code and project structure
3. **Break Down Tasks**: One component or function per prompt
4. **Iterate**: Review output, ask for modifications, don't accept blindly
5. **Test Incrementally**: Verify each piece works before moving on
6. **Ask for Explanations**: Understand the code, not just copy it

### Don'ts

1. **Don't Skip Review**: Always read and understand generated code
2. **Don't Ignore Types**: TypeScript errors indicate real problems
3. **Don't Rush**: Quality over speed; fix issues before adding features
4. **Don't Combine Tasks**: Complex prompts lead to incomplete solutions
5. **Don't Forget Edge Cases**: Ask AI to consider error states and boundaries

### Effective Prompt Structure

```
CONTEXT: [What exists, what you're building]

TASK: [Specific thing you want done]

REQUIREMENTS:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

CONSTRAINTS:
- [Technical constraints]
- [Style preferences]

OUTPUT FORMAT:
- [How you want the response structured]
```

### Iterative Development Flow

```
1. Prompt AI for initial implementation
         ↓
2. Review generated code
         ↓
3. Test in isolation
         ↓
4. Identify issues/improvements
         ↓
5. Prompt AI for fixes (with specific feedback)
         ↓
6. Repeat until satisfied
         ↓
7. Integrate into project
         ↓
8. Test integration
         ↓
9. Move to next component
```

---

## Appendix: Complete Feature Checklist

### Core Features
- [ ] React TypeScript project setup
- [ ] Tailwind CSS configuration
- [ ] Type definitions for all data structures
- [ ] Stock API service with caching
- [ ] Basic rebalancing algorithm
- [ ] Advanced rebalancing with strategies
- [ ] Authentication service
- [ ] Portfolio storage service

### Custom Hooks
- [ ] usePortfolio for state management
- [ ] useAuth for authentication
- [ ] useStockPrices for price fetching
- [ ] useUserStorage for persistence

### UI Components
- [ ] StockInput component
- [ ] ResultsPanel with animations
- [ ] EnhancedResultsTable with analysis
- [ ] RebalanceOptions configuration
- [ ] PortfolioManager CRUD
- [ ] AuthForm sign in/up

### Polish
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Animations
- [ ] Accessibility

### Testing
- [ ] Algorithm test scripts
- [ ] API debug panel
- [ ] Error boundary

---

*This guide was created to help developers effectively collaborate with AI assistants to build complex React applications. Follow the phases sequentially for best results.*
