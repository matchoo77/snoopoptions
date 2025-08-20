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
      console.log('Starting backtest with real EOD data...');
      console.log('Backtest parameters:', params);
      
      // Step 1: Get historical block trades using EOD service
      const blockTrades = await this.eodService.getHistoricalBlockTrades(
        params.symbols.length > 0 ? params.symbols : ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'],
        params.startDate,
        params.endDate,
        params.minVolume,
        params.minPremium
      );
      
      console.log(`Found ${blockTrades.length} historical block trades`);
      
      // Step 2: For each trade, get the stock price movement over the time horizon
      const results: BacktestResult[] = [];
      
      for (const trade of blockTrades) {
        // Only analyze trades that match our option type filter
        if (params.optionTypes.includes(trade.type) && params.tradeLocations.includes(trade.tradeLocation)) {
          const result = await this.analyzeTradeOutcome(trade, params.targetMovement, params.timeHorizon);
          if (result) {
            results.push(result);
          }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
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
  
  // Generate 50-100 mock trades
  const numTrades = Math.floor(Math.random() * 50) + 50;
  
  for (let i = 0; i < numTrades; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = params.optionTypes[Math.floor(Math.random() * params.optionTypes.length)];
    const tradeLocation = params.tradeLocations[Math.floor(Math.random() * params.tradeLocations.length)];
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
      tradeLocation,
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