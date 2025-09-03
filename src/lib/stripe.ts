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
    userToken: userToken ? `present (${userToken.substring(0, 20)}...)` : 'MISSING',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'MISSING'
  });
  
  if (!userToken) {
    throw new Error('User authentication token is required');
  }

  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Supabase URL not configured. Please check your environment variables.');
  }
  
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}?success=true`;
  const cancelUrl = `${baseUrl}?canceled=true`;

  console.log('🔗 Checkout URLs:', { successUrl, cancelUrl });
  
  const checkoutUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
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