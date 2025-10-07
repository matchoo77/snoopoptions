import { supabase } from '../lib/supabase';

export async function testSnoopTestEdgeFunction() {
  try {
    console.log('🧪 Testing SnoopTest edge function connectivity...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ No authentication session found');
      return { success: false, reason: 'No authentication' };
    }
    
    console.log('✅ Authentication session found, testing edge function...');
    
    // Simple test parameters
    const testParams = {
      ticker: 'SPY',
      startDate: '2025-08-01',
      endDate: '2025-08-30',
      holdPeriod: 5,
      tradeLocations: ['at-bid', 'at-ask']
    };
    
    const { data, error } = await supabase.functions.invoke('snooptest-engine', {
      body: testParams,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    
    if (error) {
      console.log('❌ Edge function error:', error);
      return { success: false, reason: error.message, error };
    }
    
    console.log('✅ Edge function responded successfully:', data);
    return { success: true, data };
    
  } catch (error) {
    console.log('❌ Test failed with exception:', error);
    return { success: false, reason: 'Exception', error };
  }
}

// Function to check if Supabase functions are deployed
export async function checkSupabaseFunctions() {
  try {
    const { data, error } = await supabase.functions.invoke('public-config');
    
    if (error) {
      console.log('❌ Supabase functions not accessible:', error);
      return false;
    }
    
    console.log('✅ Supabase functions are accessible');
    return true;
  } catch (error) {
    console.log('❌ Failed to check Supabase functions:', error);
    return false;
  }
}
