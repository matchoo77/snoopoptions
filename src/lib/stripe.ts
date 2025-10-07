interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'payment' | 'subscription';
  userToken: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession({
  priceId,
  mode,
  userToken,
}: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
  console.log('🔥 Creating checkout session with:', { 
    priceId, 
    mode, 
    userToken: userToken ? 'present' : 'MISSING',
  });
  
  if (!userToken) {
    throw new Error('User authentication token is required');
  }

  // Hardcoded Supabase URL for reliable checkout
  const supabaseUrl = 'https://vmaktasytlnftugkrlmp.supabase.co';
  
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/success`;
  const cancelUrl = `${baseUrl}?canceled=true`;

  console.log('🔗 Checkout URLs:', { successUrl, cancelUrl });
  
  const checkoutUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;
  console.log('🚀 Making request to:', checkoutUrl);

  const requestBody = {
    price_id: priceId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    mode,
  };
  console.log('📦 Request body:', requestBody);

  try {
    const response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Stripe checkout response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Stripe checkout error response:', errorText);
      
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Checkout session created successfully:', result);
    
    if (!result.url) {
      throw new Error('No checkout URL received from Stripe');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Checkout request failed:', error);
    throw error;
  }
}