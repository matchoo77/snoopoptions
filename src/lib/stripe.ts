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
  console.log('Creating checkout session with:', { priceId, mode, userToken: userToken ? 'present' : 'missing' });
  
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}?success=true`;
  const cancelUrl = `${baseUrl}?canceled=true`;

  console.log('Checkout URLs:', { successUrl, cancelUrl });
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      mode,
    }),
  });

  console.log('Stripe checkout response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Stripe checkout error:', error);
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const result = await response.json();
  console.log('Checkout session created:', result);
  return result;
}