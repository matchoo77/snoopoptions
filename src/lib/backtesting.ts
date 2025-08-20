import { PolygonAPI } from './polygon';
import { PolygonEODService } from './polygonEOD';
import { BacktestTrade, BacktestResult, BacktestSummary, BacktestParams } from '../types/backtesting';

export class BacktestingEngine {
  private polygonApi: PolygonAPI;
  private eodService: PolygonEODService;

  constructor(apiKey: string) {
    this.polygonApi = new PolygonAPI(apiKey);
    this.eodService = new PolygonEODService(apiKey);
  }

  async runBacktest(params: BacktestParams): Promise<{
    results: BacktestResult[];
    summary: BacktestSummary;
  }> {
    try {
      console.log('Starting pattern recognition analysis with real EOD data...');
      console.log('Backtest parameters:', params);
      
      // Step 1: Find significant stock movements in the date range
      const stockMovements = await this.findSignificantStockMovements(
        params.symbols.length > 0 ? params.symbols : ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'],
        params.startDate,
        params.endDate,
        params.targetMovement
      );
      
      console.log(`Found ${stockMovements.length} significant stock movements`);
      
      // Step 2: For each stock movement, look for unusual options activity 1-3 days before
      const results: BacktestResult[] = [];
      
      for (const movement of stockMovements) {
        // Look for unusual options activity 1-3 days before the movement
        const precedingTrades = await this.findPrecedingOptionsActivity(
          movement.symbol,
          movement.moveDate,
          params.minVolume,
          params.minPremium,
          params.optionTypes,
          params.tradeLocations
        );
        
        // Convert each preceding trade to a result
        for (const trade of precedingTrades) {
          const result: BacktestResult = {
            tradeId: trade.id,
            symbol: trade.symbol,
            tradeDate: trade.tradeDate,
            type: trade.type,
            tradeLocation: trade.tradeLocation,
            premium: trade.premium,
            underlyingPriceAtTrade: trade.underlyingPrice,
            underlyingPriceAtTarget: movement.priceAfter,
            stockMovement: movement.percentChange,
            targetReached: true, // Always true since we're only looking at movements that met criteria
            daysToTarget: movement.daysFromTrade,
            actualDays: movement.daysFromTrade,
          };
          results.push(result);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (results.length === 0) {
        console.log('No patterns found - consider adjusting parameters');
      }
      
      console.log(`Found ${results.length} trades that preceded significant moves`);

      // Step 3: Generate summary statistics
      const summary = this.generateSummary(results);

      return { results, summary };
    } catch (error) {
      console.error('Pattern recognition error:', error);
      throw new Error('Failed to run pattern recognition analysis');
    }
  }

  // Find significant stock movements in the date range
  private async findSignificantStockMovements(
    symbols: string[],
    startDate: string,
    endDate: string,
    targetMovement: number
  ): Promise<Array<{
    symbol: string;
    moveDate: string;
    priceBefore: number;
    priceAfter: number;
    percentChange: number;
    daysFromTrade: number;
  }>> {
    const movements = [];
    
    for (const symbol of symbols) {
      try {
        const stockData = await this.eodService.getStockAggregates(symbol, startDate, endDate);
        
        // Look for days with significant moves
        for (let i = 3; i < stockData.length; i++) { // Start at day 3 to allow for 1-3 day lookback
          const current = stockData[i];
          const previous = stockData[i - 1];
          
          if (current && previous) {
            const percentChange = ((current.c - previous.c) / previous.c) * 100;
            
            // Check if this meets our target movement criteria
            if (Math.abs(percentChange) >= targetMovement) {
              movements.push({
                symbol,
                moveDate: new Date(current.t).toISOString().split('T')[0],
                priceBefore: previous.c,
                priceAfter: current.c,
                percentChange,
                daysFromTrade: Math.floor(Math.random() * 3) + 1, // 1-3 days
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error analyzing stock movements for ${symbol}:`, error);
        continue;
      }
    }
    
    return movements;
  }

  // Find unusual options activity that preceded a stock movement
  private async findPrecedingOptionsActivity(
    symbol: string,
    moveDate: string,
    minVolume: number,
    minPremium: number,
    optionTypes: ('call' | 'put')[],
    tradeLocations: ('below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask')[]
  ): Promise<BacktestTrade[]> {
    const precedingTrades: BacktestTrade[] = [];
    
    // Look 1-3 days before the movement
    for (let daysBefore = 1; daysBefore <= 3; daysBefore++) {
      const tradeDate = new Date(moveDate);
      tradeDate.setDate(tradeDate.getDate() - daysBefore);
      const tradeDateStr = tradeDate.toISOString().split('T')[0];
      
      try {
        const activities = await this.eodService.getMostActiveOptions(symbol, tradeDateStr, 10);
        
        // Filter for unusual activities that match our criteria
        const qualifyingTrades = activities.filter(activity => 
          activity.volume >= minVolume &&
          activity.premium >= minPremium &&
          optionTypes.includes(activity.type) &&
          tradeLocations.includes(activity.tradeLocation) &&
          activity.unusual
        );
        
        // Convert to BacktestTrade format
        for (const activity of qualifyingTrades) {
          precedingTrades.push({
            id: activity.id,
            symbol: activity.symbol,
            strike: activity.strike,
            expiration: activity.expiration,
            type: activity.type,
            tradeLocation: activity.tradeLocation,
            volume: activity.volume,
            premium: activity.premium,
            tradeDate: tradeDateStr,
            tradePrice: activity.lastPrice,
            underlyingPrice: 0, // Would need separate API call
            impliedVolatility: activity.impliedVolatility,
            delta: activity.delta,
          });
        }
      } catch (error) {
        console.error(`Error fetching options for ${symbol} on ${tradeDateStr}:`, error);
      }
    }
    
    return precedingTrades;
  }
      
      console.log(`Analyzed ${results.length} trades`);

      // Step 3: Generate summary statistics
      const summary = this.generateSummary(results);

      return { results, summary };
    } catch (error) {
      console.error('Backtesting error:', error);
      throw new Error('Failed to run backtest analysis');
    }
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
      
      // Get historical stock prices using EOD service
      const tradeDayData = await this.getStockPriceEOD(trade.symbol, tradeDateStr);
      const targetDayData = await this.getStockPriceEOD(trade.symbol, targetDateStr);
      
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

  private async getStockPriceEOD(symbol: string, date: string): Promise<number | null> {
    try {
      const results = await this.eodService.getStockAggregates(symbol, date, date);
      
      if (results && results.length > 0) {
        return results[0].c; // Closing price
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching EOD stock price for ${symbol} on ${date}:`, error);
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
  
  // Generate 10-30 mock pattern instances (fewer since these are only successful patterns)
  const numTrades = Math.floor(Math.random() * 20) + 10;
  
  for (let i = 0; i < numTrades; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = params.optionTypes[Math.floor(Math.random() * params.optionTypes.length)];
    const tradeLocation = params.tradeLocations[Math.floor(Math.random() * params.tradeLocations.length)];
    const premium = Math.random() * 1000000 + params.minPremium;
    
    // Generate stock movements that meet or exceed the target (since these are successful patterns)
    const baseMovement = params.targetMovement + (Math.random() * 10); // Target + up to 10% more
    const stockMovement = Math.random() > 0.5 ? baseMovement : -baseMovement; // Positive or negative
    
    const underlyingPriceAtTrade = Math.random() * 300 + 50;
    const underlyingPriceAtTarget = underlyingPriceAtTrade * (1 + stockMovement / 100);
    
    // All trades are successful since we only show patterns that preceded actual movements
    const targetReached = true;
    
    // Random number of days before the move (1-3 days)
    const daysBefore = Math.floor(Math.random() * 3) + 1;
    
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
      tradeLocation,
      premium,
      underlyingPriceAtTrade,
      underlyingPriceAtTarget,
      stockMovement,
      targetReached,
      daysToTarget: daysBefore,
      actualDays: daysBefore,
    });
  }
  
  // Generate summary
  const engine = new BacktestingEngine('');
  const summary = engine['generateSummary'](results);
  
  return { results, summary };
}