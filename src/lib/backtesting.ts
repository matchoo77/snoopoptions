import { PolygonAPI } from './polygon';
import { BacktestTrade, BacktestResult, BacktestSummary, BacktestParams } from '../types/backtesting';

export class BacktestingEngine {
  private polygonApi: PolygonAPI;

  constructor(apiKey: string) {
    this.polygonApi = new PolygonAPI(apiKey);
  }

  async runBacktest(params: BacktestParams): Promise<{
    results: BacktestResult[];
    summary: BacktestSummary;
  }> {
    try {
      // Step 1: Get historical block trades for the period
      const blockTrades = await this.getHistoricalBlockTrades(params);
      
      // Step 2: For each trade, get the stock price movement over the time horizon
      const results: BacktestResult[] = [];
      
      for (const trade of blockTrades) {
        const result = await this.analyzeTradeOutcome(trade, params.targetMovement, params.timeHorizon);
        if (result) {
          results.push(result);
        }
      }

      // Step 3: Generate summary statistics
      const summary = this.generateSummary(results);

      return { results, summary };
    } catch (error) {
      console.error('Backtesting error:', error);
      throw new Error('Failed to run backtest analysis');
    }
  }

  private async getHistoricalBlockTrades(params: BacktestParams): Promise<BacktestTrade[]> {
    const trades: BacktestTrade[] = [];
    const symbols = params.symbols.length > 0 ? params.symbols : ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ'];
    
    // Get data for each symbol
    for (const symbol of symbols) {
      try {
        // Get options contracts for the symbol
        const aggregates = await this.polygonApi.getOptionsAggregates(ticker, params.startDate, params.endDate);
        
        // Filter contracts by expiration dates within our backtest period
        const relevantContracts = contracts.filter(contract => {
          const expDate = new Date(contract.expiration_date);
          const startDate = new Date(params.startDate);
          const endDate = new Date(params.endDate);
          return expDate >= startDate && expDate <= endDate;
        });

        // For each contract, get historical aggregates to find block trades
        for (const contract of relevantContracts.slice(0, 10)) { // Limit for API efficiency
          const ticker = this.buildOptionsTicker(contract);
          const aggregates = await this.polygonApi.getOptionsAggregates(ticker, params.startDate);
          
          // Identify block trades from aggregates
          const blockTradesForContract = this.identifyBlockTrades(aggregates, contract, params);
          trades.push(...blockTradesForContract);
        }
      } catch (error) {
        console.error(`Error getting data for ${symbol}:`, error);
        continue;
      }
    }

    return trades;
  }

  private buildOptionsTicker(contract: any): string {
    // Convert contract to Polygon options ticker format
    // Example: O:AAPL240216C00150000
    const dateStr = contract.expiration_date.replace(/-/g, '').substring(2); // YYMMDD
    const callPut = contract.contract_type === 'call' ? 'C' : 'P';
    const strikeStr = (contract.strike_price * 1000).toString().padStart(8, '0');
    
    return `O:${contract.underlying_ticker}${dateStr}${callPut}${strikeStr}`;
  }

  private identifyBlockTrades(aggregates: any[], contract: any, params: BacktestParams): BacktestTrade[] {
    const blockTrades: BacktestTrade[] = [];
    
    for (const agg of aggregates) {
      const volume = agg.volume || 0;
      const vwap = agg.vwap || agg.close || 0;
      const premium = volume * vwap * 100; // Convert to total premium
      
      // Check if this qualifies as a block trade
      if (volume >= params.minVolume && premium >= params.minPremium) {
        if (params.optionTypes.includes(contract.contract_type)) {
          const trade: BacktestTrade = {
            id: `${contract.underlying_ticker}-${agg.timestamp}-${Math.random()}`,
            symbol: contract.underlying_ticker,
            strike: contract.strike_price,
            expiration: contract.expiration_date,
            type: contract.contract_type,
            volume,
            premium,
            tradeDate: new Date(agg.timestamp).toISOString(),
            tradePrice: vwap,
            underlyingPrice: 0, // Will be fetched separately
            impliedVolatility: Math.random() * 0.8 + 0.2, // Would need separate API call
            delta: contract.contract_type === 'call' ? Math.random() * 0.8 + 0.1 : -(Math.random() * 0.8 + 0.1),
          };
          
          blockTrades.push(trade);
        }
      }
    }
    
    return blockTrades;
  }

  private async analyzeTradeOutcome(
    trade: BacktestTrade, 
    targetMovement: number, 
    timeHorizon: number
  ): Promise<BacktestResult | null> {
    try {
      const tradeDate = new Date(trade.tradeDate);
      const targetDate = new Date(tradeDate);
      targetDate.setDate(targetDate.getDate() + timeHorizon);
      
      // Get stock price at trade date and target date
      const tradeDateStr = tradeDate.toISOString().split('T')[0];
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      // Get historical stock prices (using aggregates endpoint)
      const tradeDayData = await this.getStockPrice(trade.symbol, tradeDateStr);
      const targetDayData = await this.getStockPrice(trade.symbol, targetDateStr);
      
      if (!tradeDayData || !targetDayData) {
        return null;
      }
      
      const stockMovement = ((targetDayData - tradeDayData) / tradeDayData) * 100;
      
      // Determine if target was reached based on option type
      let targetReached = false;
      if (trade.type === 'call') {
        targetReached = stockMovement >= targetMovement;
      } else {
        targetReached = stockMovement <= -targetMovement; // Puts profit from downward moves
      }
      
      return {
        tradeId: trade.id,
        symbol: trade.symbol,
        tradeDate: trade.tradeDate,
        type: trade.type,
        premium: trade.premium,
        underlyingPriceAtTrade: tradeDayData,
        underlyingPriceAtTarget: targetDayData,
        stockMovement,
        targetReached,
        daysToTarget: timeHorizon,
        actualDays: this.calculateActualDays(tradeDate, targetDate, stockMovement, targetMovement),
      };
    } catch (error) {
      console.error('Error analyzing trade outcome:', error);
      return null;
    }
  }

  private async getStockPrice(symbol: string, date: string): Promise<number | null> {
    try {
      const results = await this.polygonApi.getStockAggregates(symbol, date);
      
      if (results && results.length > 0) {
        return results[0].c; // Closing price
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching stock price for ${symbol} on ${date}:`, error);
      return null;
    }
  }

  private calculateActualDays(
    tradeDate: Date, 
    targetDate: Date, 
    actualMovement: number, 
    targetMovement: number
  ): number {
    // For now, return the full time horizon
    // In a more sophisticated version, we could track daily prices
    // and find the exact day the target was reached
    return Math.ceil((targetDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private generateSummary(results: BacktestResult[]): BacktestSummary {
    const successfulTrades = results.filter(r => r.targetReached);
    const successRate = results.length > 0 ? (successfulTrades.length / results.length) * 100 : 0;
    
    // Calculate averages
    const averageStockMovement = results.reduce((sum, r) => sum + Math.abs(r.stockMovement), 0) / results.length;
    const averageDaysToTarget = results.reduce((sum, r) => sum + r.actualDays, 0) / results.length;
    
    // Find best and worst trades
    const sortedByMovement = [...results].sort((a, b) => Math.abs(b.stockMovement) - Math.abs(a.stockMovement));
    const bestTrade = sortedByMovement[0] || null;
    const worstTrade = sortedByMovement[sortedByMovement.length - 1] || null;
    
    // Breakdown by option type
    const calls = results.filter(r => r.type === 'call');
    const puts = results.filter(r => r.type === 'put');
    const successfulCalls = calls.filter(r => r.targetReached);
    const successfulPuts = puts.filter(r => r.targetReached);
    
    // Breakdown by premium size
    const smallPremium = results.filter(r => r.premium < 100000);
    const mediumPremium = results.filter(r => r.premium >= 100000 && r.premium < 500000);
    const largePremium = results.filter(r => r.premium >= 500000);
    
    return {
      totalTrades: results.length,
      successfulTrades: successfulTrades.length,
      successRate,
      averageStockMovement: averageStockMovement || 0,
      averageDaysToTarget: averageDaysToTarget || 0,
      bestTrade,
      worstTrade,
      breakdownByType: {
        calls: {
          total: calls.length,
          successful: successfulCalls.length,
          rate: calls.length > 0 ? (successfulCalls.length / calls.length) * 100 : 0,
        },
        puts: {
          total: puts.length,
          successful: successfulPuts.length,
          rate: puts.length > 0 ? (successfulPuts.length / puts.length) * 100 : 0,
        },
      },
      breakdownBySector: {}, // Would need sector mapping
      breakdownByPremium: {
        small: {
          total: smallPremium.length,
          successful: smallPremium.filter(r => r.targetReached).length,
          rate: smallPremium.length > 0 ? (smallPremium.filter(r => r.targetReached).length / smallPremium.length) * 100 : 0,
        },
        medium: {
          total: mediumPremium.length,
          successful: mediumPremium.filter(r => r.targetReached).length,
          rate: mediumPremium.length > 0 ? (mediumPremium.filter(r => r.targetReached).length / mediumPremium.length) * 100 : 0,
        },
        large: {
          total: largePremium.length,
          successful: largePremium.filter(r => r.targetReached).length,
          rate: largePremium.length > 0 ? (largePremium.filter(r => r.targetReached).length / largePremium.length) * 100 : 0,
        },
      },
    };
  }
}

// Mock data generator for development/demo purposes
export function generateMockBacktestData(params: BacktestParams): {
  results: BacktestResult[];
  summary: BacktestSummary;
} {
  const results: BacktestResult[] = [];
  const symbols = params.symbols.length > 0 ? params.symbols : ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'];
  
  // Generate 50-100 mock trades
  const numTrades = Math.floor(Math.random() * 50) + 50;
  
  for (let i = 0; i < numTrades; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = params.optionTypes[Math.floor(Math.random() * params.optionTypes.length)];
    const premium = Math.random() * 1000000 + params.minPremium;
    
    // Generate realistic stock movements
    const baseMovement = (Math.random() - 0.5) * 20; // -10% to +10%
    const volatilityBoost = Math.random() * 10; // Additional volatility for some trades
    const stockMovement = baseMovement + (Math.random() > 0.7 ? volatilityBoost : 0);
    
    const underlyingPriceAtTrade = Math.random() * 300 + 50;
    const underlyingPriceAtTarget = underlyingPriceAtTrade * (1 + stockMovement / 100);
    
    // Determine if target was reached
    let targetReached = false;
    if (type === 'call') {
      targetReached = stockMovement >= params.targetMovement;
    } else {
      targetReached = stockMovement <= -params.targetMovement;
    }
    
    // Generate random trade date within the backtest period
    const startTime = new Date(params.startDate).getTime();
    const endTime = new Date(params.endDate).getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    const tradeDate = new Date(randomTime).toISOString();
    
    results.push({
      tradeId: `mock-${i}`,
      symbol,
      tradeDate,
      type,
      premium,
      underlyingPriceAtTrade,
      underlyingPriceAtTarget,
      stockMovement,
      targetReached,
      daysToTarget: params.timeHorizon,
      actualDays: Math.floor(Math.random() * params.timeHorizon) + 1,
    });
  }
  
  // Generate summary
  const engine = new BacktestingEngine('');
  const summary = engine['generateSummary'](results);
  
  return { results, summary };
}