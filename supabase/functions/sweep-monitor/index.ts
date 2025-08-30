import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY') ?? '';
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') ?? '';

interface LiveSweep {
  ticker: string;
  optionType: 'call' | 'put';
  tradeLocation: string;
  inferredSide: 'buy' | 'sell' | 'neutral';
  volume: number;
  premium: number;
  timestamp: string;
}

interface UserAlert {
  id: string;
  user_id: string;
  ticker: string;
  trade_locations: string[];
  min_win_rate: number;
  notification_type: 'email' | 'browser';
  is_active: boolean;
}

function corsResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

async function fetchLiveSweeps(): Promise<LiveSweep[]> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const url = `https://api.polygon.io/v3/trades/options?timestamp.gte=${fiveMinutesAgo.toISOString()}&limit=100&order=desc&apikey=${POLYGON_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }
    
    const data = await response.json();
    const sweeps: LiveSweep[] = [];
    
    if (data.results) {
      for (const trade of data.results) {
        // Parse options ticker
        const tickerMatch = trade.ticker.match(/O:([A-Z]+)(\d{6})([CP])(\d{8})/);
        if (!tickerMatch) continue;
        
        const [, underlying, , callPut] = tickerMatch;
        const optionType = callPut === 'C' ? 'call' : 'put';
        
        // Check if this is a sweep (large volume)
        if (trade.size < 100) continue;
        
        const bid = trade.price - 0.05; // Simplified
        const ask = trade.price + 0.05;
        const tradeLocation = getTradeLocation(trade.price, bid, ask);
        const inferredSide = inferTradeSide(trade.price, bid, ask);
        
        sweeps.push({
          ticker: underlying,
          optionType,
          tradeLocation,
          inferredSide,
          volume: trade.size,
          premium: trade.size * trade.price * 100,
          timestamp: new Date(trade.timestamp).toISOString(),
        });
      }
    }
    
    return sweeps;
  } catch (error) {
    console.error('Error fetching live sweeps:', error);
    return [];
  }
}

function getTradeLocation(price: number, bid: number, ask: number): string {
  const tolerance = 0.01;
  
  if (price <= bid) return 'below_bid';
  if (Math.abs(price - bid) <= tolerance) return 'at_bid';
  if (Math.abs(price - ask) <= tolerance) return 'at_ask';
  if (price >= ask) return 'above_ask';
  return 'midpoint';
}

function inferTradeSide(price: number, bid: number, ask: number): 'buy' | 'sell' | 'neutral' {
  const tolerance = 0.01;
  
  if (price >= ask - tolerance) return 'buy';
  if (price <= bid + tolerance) return 'sell';
  return 'neutral';
}

async function sendEmailAlert(email: string, sweep: LiveSweep, alertCriteria: UserAlert) {
  try {
    const emailData = {
      personalizations: [{
        to: [{ email }],
        subject: `🐕 SnoopFlow Alert: ${sweep.ticker} ${sweep.optionType.toUpperCase()} Sweep Detected`,
      }],
      from: { email: 'alerts@snoopflow.com', name: 'SnoopFlow Alerts' },
      content: [{
        type: 'text/html',
        value: `
          <h2>🚨 Unusual Options Sweep Detected</h2>
          <p><strong>${sweep.ticker}</strong> ${sweep.optionType.toUpperCase()} sweep matching your alert criteria:</p>
          <ul>
            <li><strong>Trade Location:</strong> ${sweep.tradeLocation.replace('_', ' ')}</li>
            <li><strong>Inferred Side:</strong> ${sweep.inferredSide.toUpperCase()}</li>
            <li><strong>Volume:</strong> ${sweep.volume.toLocaleString()} contracts</li>
            <li><strong>Premium:</strong> $${sweep.premium.toLocaleString()}</li>
            <li><strong>Time:</strong> ${new Date(sweep.timestamp).toLocaleString()}</li>
          </ul>
          <p>This pattern has shown a ${alertCriteria.min_win_rate}%+ win rate in your backtests.</p>
          <p><a href="https://snoopflow.com">View in SnoopFlow Dashboard →</a></p>
        `,
      }],
    };

    const response = await fetch('https://api.sendgrid.v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.status}`);
    }

    console.log(`Email alert sent to ${email} for ${sweep.ticker} sweep`);
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
}

async function checkAlertsAndNotify(sweeps: LiveSweep[]) {
  try {
    // Get all active alerts with user email
    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select(`
        *,
        users:user_id (email)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching alerts:', error);
      return;
    }

    for (const alert of alerts || []) {
      for (const sweep of sweeps) {
        // Check if sweep matches alert criteria
        if (
          sweep.ticker === alert.ticker &&
          alert.trade_locations.includes(sweep.tradeLocation) &&
          sweep.inferredSide !== 'neutral'
        ) {
          console.log(`Alert match found: ${sweep.ticker} ${sweep.optionType} ${sweep.tradeLocation}`);
          
          // Send notification based on type
          if (alert.notification_type === 'email' && alert.users?.email) {
            await sendEmailAlert(alert.users.email, sweep, alert);
          }
          // Browser notifications would be handled on the frontend
        }
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method === 'GET') {
      // Monitor endpoint - fetch live sweeps and check alerts
      const sweeps = await fetchLiveSweeps();
      await checkAlertsAndNotify(sweeps);
      
      return corsResponse({
        sweeps: sweeps.length,
        timestamp: new Date().toISOString(),
        message: 'Sweep monitoring completed',
      });
    }

    if (req.method === 'POST') {
      // Manual alert check endpoint
      const { sweeps } = await req.json();
      await checkAlertsAndNotify(sweeps);
      
      return corsResponse({ message: 'Alerts checked' });
    }

    return corsResponse({ error: 'Method not allowed' }, 405);

  } catch (error: any) {
    console.error('Sweep monitor error:', error);
    return corsResponse({ error: error.message }, 500);
  }
});