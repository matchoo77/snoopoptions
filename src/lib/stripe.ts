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
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}?success=true`;
  const cancelUrl = `${baseUrl}?canceled=true`;

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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}