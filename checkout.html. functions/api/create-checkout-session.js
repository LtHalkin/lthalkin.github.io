// functions/api/create-checkout-session.js
//
// This is a Cloudflare Pages Function. It runs on Cloudflare's servers,
// not in the browser — so this is the ONLY safe place to use your Stripe
// SECRET key. Never put the secret key in checkout.html or any file the
// browser can see.
//
// Set your secret key in: Cloudflare Dashboard → your Pages project →
// Settings → Environment variables → add STRIPE_SECRET_KEY = sk_live_...
// (Do this in the dashboard, NOT in this file, so it never gets committed to GitHub.)

// ---- 1. YOUR PRODUCT CATALOG (server-side source of truth for prices) ----
// Edit this to match your real products/variants and prices in CENTS.
// This is what actually gets charged — whatever the browser sends is ignored
// for price, so nobody can edit the page and pay less.
const PRODUCTS = {
  'butter-squish_salted':  { name: 'Butter Squish — Salted (original)', unitAmount: 1800 },
  'butter-squish_whipped': { name: 'Butter Squish — Whipped',           unitAmount: 1800 },
  'butter-squish_toast':   { name: 'Butter Squish — Brown butter',      unitAmount: 1800 },
};

const CURRENCY = 'usd'; // change to 'eur' if you want to charge in euro

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.STRIPE_SECRET_KEY) {
      return jsonError('Server is not configured with a Stripe secret key.', 500);
    }

    const body = await request.json();
    const cart = Array.isArray(body.cart) ? body.cart : [];
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (cart.length === 0) {
      return jsonError('Cart is empty.', 400);
    }

    // Build Stripe line items using OUR price map, not the browser's.
    const params = new URLSearchParams();
    let index = 0;

    for (const item of cart) {
      const key = `${item.id}_${item.variant}`;
      const product = PRODUCTS[key];
      const qty = Number(item.qty);

      if (!product) {
        return jsonError(`Unknown product/variant: ${key}`, 400);
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        return jsonError(`Invalid quantity for ${key}`, 400);
      }

      params.append(`line_items[${index}][price_data][currency]`, CURRENCY);
      params.append(`line_items[${index}][price_data][product_data][name]`, product.name);
      params.append(`line_items[${index}][price_data][unit_amount]`, String(product.unitAmount));
      params.append(`line_items[${index}][quantity]`, String(qty));
      index++;
    }

    params.append('mode', 'payment');

    // Where Stripe sends the customer back to after payment.
    const origin = new URL(request.url).origin;
    params.append('success_url', `${origin}/checkout.html?success=1&session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${origin}/checkout.html?canceled=1`);

    // Let Stripe collect the shipping address on its hosted page.
    params.append('shipping_address_collection[allowed_countries][]', 'IE');
    params.append('shipping_address_collection[allowed_countries][]', 'GB');
    params.append('shipping_address_collection[allowed_countries][]', 'US');
    params.append('shipping_address_collection[allowed_countries][]', 'CA');
    params.append('shipping_address_collection[allowed_countries][]', 'AU');
    params.append('shipping_address_collection[allowed_countries][]', 'DE');
    params.append('shipping_address_collection[allowed_countries][]', 'FR');

    if (email) {
      params.append('customer_email', email);
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe error:', session);
      return jsonError(session.error?.message || 'Stripe request failed.', 502);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('create-checkout-session error:', err);
    return jsonError('Unexpected server error.', 500);
  }
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
