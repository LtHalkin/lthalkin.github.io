/* ---------- Cart state (persisted in localStorage) ---------- */
const CART_KEY = 'churned_cart_v1';
const VARIANT_LABELS = { salted: 'Salted (original)', whipped: 'Whipped', toast: 'Brown butter' };

function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item){
  const cart = getCart();
  const existing = cart.find(c => c.id === item.id && c.variant === item.variant);
  if(existing){ existing.qty += item.qty; }
  else { cart.push(item); }
  saveCart(cart);
  if(typeof renderCartDrawer === 'function') renderCartDrawer();
}

function removeFromCart(index){
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  if(typeof renderCartDrawer === 'function') renderCartDrawer();
  if(typeof renderCheckout === 'function') renderCheckout();
}

function setQty(index, qty){
  const cart = getCart();
  if(!cart[index]) return;
  if(qty <= 0){ cart.splice(index, 1); }
  else { cart[index].qty = qty; }
  saveCart(cart);
  if(typeof renderCartDrawer === 'function') renderCartDrawer();
  if(typeof renderCheckout === 'function') renderCheckout();
}

function clearCart(){
  saveCart([]);
}

function cartCount(){ return getCart().reduce((s, i) => s + i.qty, 0); }
function cartTotal(){ return getCart().reduce((s, i) => s + (i.qty * i.price), 0); }

function variantLabel(v){ return VARIANT_LABELS[v] || v; }

function updateCartBadge(){
  document.querySelectorAll('.cart-badge').forEach(badge => {
    const c = cartCount();
    badge.textContent = c;
    badge.style.display = c > 0 ? 'flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
