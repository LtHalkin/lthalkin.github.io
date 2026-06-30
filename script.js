/* ---------- Squish interaction ---------- */
const wrap = document.getElementById('squishWrap');
const hint = document.getElementById('hint');
const crumbsBox = document.getElementById('crumbs');

function spawnCrumbs(){
  crumbsBox.innerHTML = '';
  for(let i = 0; i < 10; i++){
    const c = document.createElement('div');
    c.className = 'crumb';
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    c.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    c.style.left = (45 + Math.random() * 10) + '%';
    crumbsBox.appendChild(c);
  }
}

function press(){
  wrap.classList.add('active');
  spawnCrumbs();
  if(hint) hint.style.opacity = '0';
}
function release(){
  wrap.classList.remove('active');
}

wrap.addEventListener('mousedown', press);
wrap.addEventListener('touchstart', press, { passive: true });
['mouseup', 'mouseleave'].forEach(evt => wrap.addEventListener(evt, release));
wrap.addEventListener('touchend', release);
wrap.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); press(); setTimeout(release, 500); }
});
wrap.setAttribute('tabindex', '0');
wrap.setAttribute('role', 'button');
wrap.setAttribute('aria-label', 'Press and hold to squish the butter');

/* ---------- Toast ---------- */
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Quantity stepper (buy section) ---------- */
const qtyEl = document.getElementById('qty');
let qty = 1;
document.getElementById('inc').addEventListener('click', () => {
  qty = Math.min(qty + 1, 10);
  qtyEl.textContent = qty;
});
document.getElementById('dec').addEventListener('click', () => {
  qty = Math.max(qty - 1, 1);
  qtyEl.textContent = qty;
});

/* ---------- Variant swatches ---------- */
let selectedVariant = 'salted';
const miniSquish = document.getElementById('miniSquish');

document.querySelectorAll('.swatch').forEach(s => {
  s.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(o => o.classList.remove('active'));
    s.classList.add('active');
    selectedVariant = s.dataset.variant;
    miniSquish.className = 'squish-mini ' + selectedVariant;
  });
  s.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); s.click(); }
  });
});

/* ---------- Add to cart ---------- */
document.getElementById('addToCartBtn').addEventListener('click', (e) => {
  e.preventDefault();
  addToCart({
    id: 'butter-squish',
    name: 'Butter Squish',
    variant: selectedVariant,
    price: 18,
    qty: qty
  });
  showToast(`Added ${qty} × ${variantLabel(selectedVariant)} to your basket`);
  openCart();
  qty = 1;
  qtyEl.textContent = qty;
});

/* ---------- Cart drawer ---------- */
const cartBtn = document.getElementById('cartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartBtn = document.getElementById('closeCart');

function openCart(){
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
}
function closeCart(){
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeCart(); });

function renderCartDrawer(){
  const itemsBox = document.getElementById('cartItems');
  if(!itemsBox) return;
  const cart = getCart();

  if(cart.length === 0){
    itemsBox.innerHTML = '<p class="cart-empty">Your basket is empty. Go squish something.</p>';
  } else {
    itemsBox.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-swatch ${item.variant}"></div>
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <span>${variantLabel(item.variant)}</span>
          <div class="cart-item-stepper">
            <button type="button" aria-label="Decrease quantity" onclick="setQty(${i}, ${item.qty - 1})">−</button>
            <span>${item.qty}</span>
            <button type="button" aria-label="Increase quantity" onclick="setQty(${i}, ${item.qty + 1})">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <span>$${item.qty * item.price}</span>
          <button type="button" class="cart-remove" onclick="removeFromCart(${i})">Remove</button>
        </div>
      </div>
    `).join('');
  }

  const subtotalEl = document.getElementById('cartSubtotal');
  if(subtotalEl) subtotalEl.textContent = '$' + cartTotal();

  const checkoutBtn = document.getElementById('checkoutBtn');
  if(checkoutBtn){
    if(cart.length === 0){
      checkoutBtn.setAttribute('aria-disabled', 'true');
      checkoutBtn.style.pointerEvents = 'none';
      checkoutBtn.style.opacity = '0.5';
    } else {
      checkoutBtn.removeAttribute('aria-disabled');
      checkoutBtn.style.pointerEvents = 'auto';
      checkoutBtn.style.opacity = '1';
    }
  }

  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', renderCartDrawer);

/* ---------- Mobile menu ---------- */
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
menuToggle.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
