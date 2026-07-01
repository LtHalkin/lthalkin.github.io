// Churned — Cloudflare Worker
// Handles: (1) real Stripe Checkout session creation, (2) serving the static site.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
      return handleCreateCheckoutSession(request, env, url);
    }

    // everything else: serve the static files in /public
    return env.ASSETS.fetch(request);
  },
};

async function handleCreateCheckoutSession(request, env, url) {
  try {
    const { cart, email } = await request.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return jsonResponse({ error: 'Cart is empty' }, 400);
    }

    // Build the Stripe line_items form body.
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${url.origin}/checkout.html?success=1`);
    params.append('cancel_url', `${url.origin}/checkout.html?canceled=1`);
    if (email) params.append('customer_email', email);
    params.append('shipping_address_collection[allowed_countries][]', 'IE');
    params.append('shipping_address_collection[allowed_countries][]', 'GB');
    params.append('shipping_address_collection[allowed_countries][]', 'US');
    params.append('shipping_address_collection[allowed_countries][]', 'CA');
    params.append('shipping_address_collection[allowed_countries][]', 'AU');

    cart.forEach((item, i) => {
      // Server-side price lookup — never trust the price sent from the browser.
      const unitAmount = 1800; // $18.00 flat price for the Butter Squish, in cents
      const variantLabel = { salted: 'Salted (original)', whipped: 'Whipped', toast: 'Brown butter' }[item.variant] || item.variant;

      params.append(`line_items[${i}][price_data][currency]`, 'usd');
      params.append(`line_items[${i}][price_data][unit_amount]`, String(unitAmount));
      params.append(`line_items[${i}][price_data][product_data][name]`, `Butter Squish — ${variantLabel}`);
      params.append(`line_items[${i}][quantity]`, String(item.qty || 1));
    });

    const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeResp.json();

    if (!stripeResp.ok) {
      return jsonResponse({ error: session.error?.message || 'Stripe error' }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ error: err.message || 'Unexpected error' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
