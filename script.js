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

/* ---------- Squish Lab ---------- */
const labStage = document.getElementById('labStage');
const labSquish = document.getElementById('labSquish');
const labCrumbs = document.getElementById('labCrumbs');
const labCountEl = document.getElementById('labCount');
const soundToggleBtn = document.getElementById('soundToggle');

const COUNT_KEY = 'churned_squish_count';
const MUTE_KEY = 'churned_sound_muted';

let labCount = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10) || 0;
let muted = localStorage.getItem(MUTE_KEY) === 'true';

function renderLabCount(){ labCountEl.textContent = labCount.toLocaleString(); }
function bumpLabCount(n = 1){
  labCount += n;
  localStorage.setItem(COUNT_KEY, labCount);
  renderLabCount();
}
renderLabCount();
soundToggleBtn.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';

/* tiny synthesized "boop" — no audio file needed */
let audioCtx;
function playBoop(){
  if(muted) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.16, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.22);
  } catch(e){ /* audio unsupported, fail silently */ }
}

function spawnLabCrumbs(n = 6){
  for(let i = 0; i < n; i++){
    const c = document.createElement('div');
    c.className = 'crumb';
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 90;
    c.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    c.style.left = (45 + Math.random() * 10) + '%';
    c.style.top = (45 + Math.random() * 10) + '%';
    labCrumbs.appendChild(c);
    setTimeout(() => c.remove(), 650);
  }
}

function getPos(e){
  if(e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

let dragging = false;
let startX = 0, startY = 0;

function startDrag(e){
  dragging = true;
  const p = getPos(e);
  startX = p.x; startY = p.y;
  labSquish.style.transition = 'none';
  labSquish.classList.add('squishing');
  spawnLabCrumbs(4);
  playBoop();
  bumpLabCount();
}

function moveDrag(e){
  if(!dragging) return;
  const p = getPos(e);
  const dx = p.x - startX;
  const stretch = Math.min(Math.max(Math.abs(dx) / 140, 0), 0.6);
  const skew = Math.max(Math.min(dx / 12, 18), -18);
  labSquish.style.transform = `scaleY(${0.62 - stretch * 0.15}) scaleX(${1.3 + stretch}) skewX(${skew}deg)`;
}

function endDrag(){
  if(!dragging) return;
  dragging = false;
  labSquish.style.transition = '';
  labSquish.style.transform = '';
  labSquish.classList.remove('squishing');
}

labStage.addEventListener('mousedown', startDrag);
labStage.addEventListener('touchstart', startDrag, { passive: true });
window.addEventListener('mousemove', moveDrag);
window.addEventListener('touchmove', moveDrag, { passive: true });
window.addEventListener('mouseup', endDrag);
window.addEventListener('touchend', endDrag);

labSquish.addEventListener('dblclick', () => {
  labSquish.classList.remove('poke');
  void labSquish.offsetWidth;
  labSquish.classList.add('poke');
  spawnLabCrumbs(6);
  playBoop();
  bumpLabCount();
});

labSquish.addEventListener('animationend', () => {
  labSquish.classList.remove('poke', 'toss');
});

document.getElementById('pokeBtn').addEventListener('click', () => {
  labSquish.classList.remove('poke');
  void labSquish.offsetWidth;
  labSquish.classList.add('poke');
  spawnLabCrumbs(6);
  playBoop();
  bumpLabCount();
});

document.getElementById('stretchBtn').addEventListener('click', () => {
  labSquish.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
  labSquish.style.transform = 'scaleY(0.55) scaleX(1.7)';
  playBoop();
  bumpLabCount();
  setTimeout(() => { labSquish.style.transform = ''; }, 420);
});

document.getElementById('tossBtn').addEventListener('click', () => {
  labSquish.classList.remove('toss');
  void labSquish.offsetWidth;
  labSquish.classList.add('toss');
  playBoop();
  bumpLabCount();
});

soundToggleBtn.addEventListener('click', () => {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted);
  soundToggleBtn.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
});

document.getElementById('resetCountBtn').addEventListener('click', () => {
  labCount = 0;
  localStorage.setItem(COUNT_KEY, '0');
  renderLabCount();
});

labStage.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    labSquish.classList.add('squishing');
    spawnLabCrumbs(4);
    playBoop();
    bumpLabCount();
    setTimeout(() => labSquish.classList.remove('squishing'), 450);
  }
});
