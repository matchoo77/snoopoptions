import { PolygonEODService } from './polygonEOD';
import { BacktestTrade, BacktestResult, BacktestSummary, BacktestParams } from '../types/backtesting';
import { getPolygonApiKey } from '../config/api';

export class BacktestingEngine {
  private eodService: PolygonEODService;
  private apiKey: string;

  constructor() {
    // Use centralized API key configuration
    this.apiKey = getPolygonApiKey();
    this.eodService = new PolygonEODService();
    console.log('[Backtest] Advanced backtesting engine initialized with Polygon API');
  }

  async runBacktest(params: BacktestParams): Promise<{
    results: BacktestResult[];
    summary: BacktestSummary;
  }> {
    try {
      console.log('[Backtest] Starting advanced pattern recognition analysis...');
      console.log('[Backtest] Parameters:', params);
      console.log(`[Backtest] Using API key: ${this.apiKey.substring(0, 8)}...`);

      const symbols = params.symbols.length > 0 ? params.symbols : ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META'];

      // Step 1: Find significant stock movements in the time period
      console.log('[Backtest] Phase 1: Finding significant stock movements...');
      const stockMovements = await this.findSignificantStockMovements(
        symbols,
        params.startDate,
        params.endDate,
        params.targetMovement
      );

      console.log(`[Backtest] Found ${stockMovements.length} significant stock movements`);

      // Step 2: For each significant movement, find preceding options activity
      console.log('[Backtest] Phase 2: Finding preceding options activity...');
      const results: BacktestResult[] = [];

      for (const movement of stockMovements) {
        const precedingTrades = await this.findPrecedingOptionsActivity(
          movement.symbol,
          movement.moveDate,
          params.minVolume,
          params.minPremium,
          params.optionTypes,
          params.tradeLocations
        );

        // Analyze each preceding trade's outcome
        for (const trade of precedingTrades) {
          const result = await this.analyzeTradeOutcome(trade, params.targetMovement, params.timeHorizon);
          if (result) {
            // Use the actual stock movement data we found
            result.stockMovement = movement.percentChange;
            result.underlyingPriceAtTrade = movement.priceBefore;
            result.underlyingPriceAtTarget = movement.priceAfter;
            result.targetReached = Math.abs(movement.percentChange) >= params.targetMovement;
            result.actualDays = movement.daysFromTrade;
            
            results.push(result);
          }
        }

        // Rate limiting - small delay between symbols
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[Backtest] Generated ${results.length} results from real market analysis`);

      // Step 4: Generate summary statistics
      const summary = this.generateSummary(results);

      console.log(`[Backtest] Analysis complete: ${results.length} total results, ${summary.successRate.toFixed(1)}% success rate`);

      return { results, summary };
    } catch (error) {
      console.error('[Backtest] Advanced pattern recognition error:', error);

      // Return empty results - no real data available without proper API integration
      const emptyResults: BacktestResult[] = [];
      const summary = this.generateSummary(emptyResults);

      return { results: emptyResults, summary };
    }
  }

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
    console.log(`[Backtest] Finding stock movements for ${symbols.length} symbols from ${startDate} to ${endDate}`);
    const movements = [];

    for (const symbol of symbols) {
      try {
        console.log(`[Backtest] Getting stock data for ${symbol}...`);
        const stockData = await this.eodService.getStockAggregates(symbol, startDate, endDate);
        console.log(`[Backtest] Got ${stockData.length} days of stock data for ${symbol}`);

        if (stockData.length === 0) {
          console.warn(`[Backtest] No stock data returned for ${symbol}, possibly due to rate limits or invalid symbol`);
          continue;
        }

        // Look for days with significant moves
        for (let i = 3; i < stockData.length; i++) { // Start at day 3 to allow for 1-3 day lookback
          const current = stockData[i];
          const previous = stockData[i - 1];

          if (current && previous) {
            const percentChange = ((current.c - previous.c) / previous.c) * 100;

            // Check if this meets our target movement criteria
            if (Math.abs(percentChange) >= targetMovement) {
              console.log(`[Backtest] Found significant move: ${symbol} ${percentChange.toFixed(1)}% on ${new Date(current.t).toISOString().split('T')[0]}`);
              movements.push({
                symbol,
                moveDate: new Date(current.t).toISOString().split('T')[0],
                priceBefore: previous.c,
                priceAfter: current.c,
                percentChange,
                daysFromTrade: 1, // Would need to calculate actual days from trade data
              });
            }
          }
        }
      } catch (error) {
        console.error(`[Backtest] Error analyzing stock movements for ${symbol}:`, error);
        continue;
      }
    }

    console.log(`[Backtest] Total significant movements found: ${movements.length}`);
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
    console.log(`[Backtest] Looking for options activity preceding ${symbol} move on ${moveDate}`);
    const precedingTrades: BacktestTrade[] = [];

    // Look 1-3 days before the movement
    for (let daysBefore = 1; daysBefore <= 3; daysBefore++) {
      const tradeDate = new Date(moveDate);
      tradeDate.setDate(tradeDate.getDate() - daysBefore);
      const tradeDateStr = tradeDate.toISOString().split('T')[0];

      try {
        console.log(`[Backtest] Checking ${symbol} options activity on ${tradeDateStr} (${daysBefore} days before move)`);
        const activities = await this.eodService.getMostActiveOptions(symbol, tradeDateStr, 10);
        console.log(`[Backtest] Found ${activities.length} activities for ${symbol} on ${tradeDateStr}`);

        // Filter for unusual activities that match our criteria
        const qualifyingTrades = activities.filter(activity =>
          activity.volume >= minVolume &&
          activity.premium >= minPremium &&
          optionTypes.includes(activity.type) &&
          tradeLocations.includes(activity.tradeLocation) &&
          activity.unusual
        );

        console.log(`[Backtest] ${qualifyingTrades.length} trades qualify for ${symbol} on ${tradeDateStr}`);

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
        console.error(`[Backtest] Error fetching options for ${symbol} on ${tradeDateStr}:`, error);
      }
    }

    console.log(`[Backtest] Total preceding trades found for ${symbol}: ${precedingTrades.length}`);
    return precedingTrades;
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
        tradeLocation: trade.tradeLocation,
        premium: trade.premium,
        underlyingPriceAtTrade: tradeDayData,
        underlyingPriceAtTarget: targetDayData,
        stockMovement,
        targetReached,
        daysToTarget: timeHorizon,
        actualDays: this.calculateActualDays(tradeDate, targetDate),
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
    targetDate: Date
  ): number {
    // Return the full time horizon for now
    return Math.ceil((targetDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private generateSummary(results: BacktestResult[]): BacktestSummary {
    if (results.length === 0) {
      // Return a default summary when no results are found
      return {
        totalTrades: 0,
        successfulTrades: 0,
        successRate: 0,
        averageStockMovement: 0,
        averageDaysToTarget: 0,
        bestTrade: null,
        worstTrade: null,
        breakdownByType: {
          calls: { total: 0, successful: 0, rate: 0 },
          puts: { total: 0, successful: 0, rate: 0 }
        },
        breakdownBySector: {},
        breakdownByPremium: {
          small: { total: 0, successful: 0, rate: 0 },
          medium: { total: 0, successful: 0, rate: 0 },
          large: { total: 0, successful: 0, rate: 0 }
        }
      };
    }

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