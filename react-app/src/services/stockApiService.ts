import { ApiStockPrice } from '../types';

// Finnhub API endpoint - following official documentation
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export class StockApiService {
  private static instance: StockApiService;
  private cache: Map<string, { price: number; timestamp: number; source: string }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly REQUEST_DELAY = 200; // 200ms between requests to avoid rate limits

  public static getInstance(): StockApiService {
    if (!StockApiService.instance) {
      StockApiService.instance = new StockApiService();
    }
    return StockApiService.instance;
  }

  async getStockPrice(symbol: string): Promise<ApiStockPrice> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol.toUpperCase());
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`📋 Cache hit: ${symbol} = $${cached.price} (${cached.source})`);
        return { symbol, price: cached.price };
      }

      // Use only Finnhub API
      await this.delay(this.REQUEST_DELAY); // Rate limiting
      const result = await this.getFinnhubPrice(symbol);
      return result;

    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return this.getNoDataResponse(symbol);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getFinnhubPrice(symbol: string): Promise<ApiStockPrice> {
    // Get API key from environment
    const apiKey = process.env.REACT_APP_FINNHUB_API_KEY;
    
    // Debug logging
    console.log('🔍 Environment check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined',
      allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
    });
    
    if (!apiKey || apiKey === 'demo') {
      console.error('❌ Finnhub API key not found in environment variables');
      console.error('Available REACT_APP_ variables:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
      throw new Error('Finnhub API key not configured');
    }

    // Following Finnhub documentation: GET /quote
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${apiKey}`;
    
    console.log(`🔄 Fetching ${symbol} from Finnhub...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Finnhub API error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid Finnhub API key');
      }
      if (response.status === 429) {
        throw new Error('Finnhub rate limit exceeded');
      }
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Finnhub response for ${symbol}:`, data);
    
    // Check for API error in response
    if (data.error) {
      throw new Error(`Finnhub API error: ${data.error}`);
    }
    
    // Validate response structure according to Finnhub docs
    if (typeof data.c !== 'number' || data.c <= 0) {
      console.warn(`Invalid price data from Finnhub for ${symbol}:`, data);
      throw new Error(`No valid price data for ${symbol}`);
    }

    const price = data.c; // Current price
    this.cachePrice(symbol, price, 'Finnhub');
    
    console.log(`✅ Finnhub: ${symbol} = $${price}`);
    return { symbol, price };
  }

  private cachePrice(symbol: string, price: number, source: string): void {
    this.cache.set(symbol.toUpperCase(), { 
      price, 
      timestamp: Date.now(), 
      source 
    });
  }

  async getMultipleStockPrices(symbols: string[]): Promise<ApiStockPrice[]> {
    const results: ApiStockPrice[] = [];
    
    // Process symbols in batches to avoid overwhelming API
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => this.getStockPrice(symbol));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Delay between batches
      if (i + batchSize < symbols.length) {
        await this.delay(1000); // 1 second between batches
      }
    }
    
    return results;
  }

  // Return N/A when no real-time data is available
  private getNoDataResponse(symbol: string): ApiStockPrice {
    console.log(`❌ No data available for ${symbol}`);
    
    // Cache N/A response
    this.cache.set(symbol.toUpperCase(), { 
      price: 0, 
      timestamp: Date.now(), 
      source: 'N/A - No Data Available'
    });
    
    return { 
      symbol, 
      price: 0,
      error: 'No data available from Finnhub API'
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Price cache cleared');
  }

  getCacheStats(): { size: number; entries: Array<{ symbol: string; price: number; age: number; source: string }> } {
    const entries = Array.from(this.cache.entries()).map(([symbol, data]) => ({
      symbol,
      price: data.price,
      age: Math.round((Date.now() - data.timestamp) / 1000),
      source: data.source
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  // Test API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testResult = await this.getFinnhubPrice('AAPL');
      return {
        success: true,
        message: `Connection successful. AAPL price: $${testResult.price}`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const stockApiService = StockApiService.getInstance();