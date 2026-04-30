let currentUser = null;
let currentCat = '';
let allFilter = 'all';
let cart = [];
let cartSubtotal = 0;
const DELIVERY_FEE = 50;
let driverViewTab = 'available';

// Group Buy Tracking
let activePledgeData = null; 

// Tracking intervals dictionary
let driverTrackingLoops = {};
let consumerTrackLoop = null;

const EMOJIS = {
  veg: {
    default: '🥦',
    tomato: '🍅', tomatoes: '🍅',
    potato: '🥔', potatoes: '🥔',
    onion: '🧅', onions: '🧅',
    garlic: '🧄',
    carrot: '🥕', carrots: '🥕',
    corn: '🌽', maize: '🌽',
    broccoli: '🥦',
    lettuce: '🥬', cabbage: '🥬', spinach: '🥬', kale: '🥬', leafy: '🥬',
    cucumber: '🥒', cucumbers: '🥒',
    eggplant: '🍆', brinjal: '🍆', aubergine: '🍆',
    pepper: '🫑', capsicum: '🫑', chilli: '🌶️', chili: '🌶️', green_chilli: '🌶️',
    pea: '🫛', peas: '🫛',
    bean: '🫘', beans: '🫘',
    mushroom: '🍄', mushrooms: '🍄',
    radish: '🌱', turnip: '🌱',
    beetroot: '🫚', beet: '🫚',
    pumpkin: '🎃', gourd: '🎃', bottle_gourd: '🎃',
    sweet_potato: '🍠', yam: '🍠',
  },
  fruit: {
    default: '🍑',
    mango: '🥭', mangoes: '🥭',
    apple: '🍎', apples: '🍎',
    banana: '🍌', bananas: '🍌',
    orange: '🍊', oranges: '🍊',
    grape: '🍇', grapes: '🍇',
    watermelon: '🍉',
    strawberry: '🍓', strawberries: '🍓',
    pineapple: '🍍',
    lemon: '🍋', lime: '🍋',
    coconut: '🥥',
    papaya: '🫐',
    guava: '🍈',
    pomegranate: '💎',
    kiwi: '🥝',
    pear: '🍐', pears: '🍐',
    cherry: '🍒', cherries: '🍒',
    peach: '🍑', peaches: '🍑',
    blueberry: '🫐', blueberries: '🫐',
    fig: '🍈', dates: '🌴',
    plum: '🍑', plums: '🍑',
    jackfruit: '🍈',
  },
  flower: {
    default: '🌸',
    rose: '🌹', roses: '🌹',
    sunflower: '🌻', sunflowers: '🌻',
    marigold: '🌼', marigolds: '🌼',
    tulip: '🌷', tulips: '🌷',
    lily: '🌸', lilies: '🌸',
    lotus: '🪷',
    jasmine: '🤍',
    daisy: '🌼', daisies: '🌼',
    lavender: '💜',
    orchid: '🌺', orchids: '🌺',
    hibiscus: '🌺',
    chrysanthemum: '🌸',
    poppy: '🌺',
  }
};

function getEmoji(name, cat) {
  if (!name || !EMOJIS[cat]) return EMOJIS[cat]?.default || '🌿';
  const key = name.trim().toLowerCase().replace(/\s+/g, '_');
  // Try exact match first, then partial word match
  if (EMOJIS[cat][key]) return EMOJIS[cat][key];
  const words = name.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (EMOJIS[cat][word]) return EMOJIS[cat][word];
  }
  return EMOJIS[cat].default;
}

function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2800); }
function hideAll() { ['heroSection','farmerLogin','consumerLogin','driverLogin','farmerDash','addSection','consumerDash','driverDash'].forEach(id => document.getElementById(id).classList.add('hidden')); }
function goHome() { hideAll(); document.getElementById('heroSection').classList.remove('hidden'); }
function showFarmerLogin() { hideAll(); document.getElementById('farmerLogin').classList.remove('hidden'); }
function showConsumerLogin() { hideAll(); document.getElementById('consumerLogin').classList.remove('hidden'); }
function showDriverLogin() { hideAll(); document.getElementById('driverLogin').classList.remove('hidden'); }
function closeModal(e, id) { if(e.target.id === id) document.getElementById(id).classList.add('hidden'); }

// Geolocation
function detectLocation(inputId) {
  if (!navigator.geolocation) { showToast('GPS not supported'); return; }
  showToast('📍 Detecting location...');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.state_district || 'Unknown City';
      document.getElementById(inputId).value = `${city}, ${data.address.state || ''}`;
      showToast('📍 Location detected!');
    } catch (error) { document.getElementById(inputId).value = `Lat: ${pos.coords.latitude.toFixed(3)}, Lng: ${pos.coords.longitude.toFixed(3)}`; showToast('📍 Location detected via coordinates'); }
  }, () => showToast('⚠️ GPS denied — enter manually'));
}

/* ─── FARMER FLOW ─── */
function proceedFarmer() {
  const name = document.getElementById('farmerName').value.trim();
  const phone = document.getElementById('farmerPhone').value.trim();
  const pass = document.getElementById('farmerPassword').value.trim();
  const loc = document.getElementById('farmerLocInput').value.trim() || 'Local Farm';
  if (!name || !/^\d{10}$/.test(phone) || !pass) { showToast('⚠️ Check details'); return; }
  
  let activeFarmers = JSON.parse(localStorage.getItem('activeFarmers') || '[]');
  let existingFarmer = activeFarmers.find(f => f.phone === phone);
  if (existingFarmer && existingFarmer.password !== pass) { showToast('❌ Incorrect password!'); return; }
  if (!existingFarmer) { activeFarmers.push({ name, phone, loc, password: pass }); localStorage.setItem('activeFarmers', JSON.stringify(activeFarmers)); }

  currentUser = { type:'farmer', name, phone, loc };
  document.getElementById('farmerInitial').textContent = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('farmerChipName').textContent = name;
  document.getElementById('farmerChipLoc').textContent = '📍 ' + loc;
  showFarmerDash();
  showToast('🌱 Welcome back, ' + name + '!');
}

function showFarmerDash() { hideAll(); document.getElementById('farmerDash').classList.remove('hidden'); }
function showAdd(cat) { currentCat = cat; document.getElementById('addHeader').className = 'add-header ' + cat; hideAll(); document.getElementById('addSection').classList.remove('hidden'); }

function addProduct() {
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const qty = parseInt(document.getElementById('pQty').value);
  const min = parseInt(document.getElementById('pMin').value);
  if (!name || isNaN(price) || price <= 0 || isNaN(qty) || isNaN(min) || min > qty) { showToast('⚠️ Check your details (Min Qty ≤ Stock)'); return; }
  let products = JSON.parse(localStorage.getItem(currentCat) || '[]');
  products.push({ id: 'P-'+Date.now(), name, price, qty, min, loc: currentUser.loc || 'Local Farm', phone: currentUser.phone, farmerName: currentUser.name });
  localStorage.setItem(currentCat, JSON.stringify(products));
  showToast('✅ Product listed!'); setTimeout(showFarmerDash, 600);
}

/* ─── CONSUMER FLOW ─── */
function proceedConsumer() {
  const name = document.getElementById('consumerName').value.trim();
  const phone = document.getElementById('consumerPhone').value.trim();
  const loc = document.getElementById('consumerLocation').value.trim();
  if (!name || !/^\d{10}$/.test(phone) || !loc) { showToast('⚠️ Fill all fields correctly'); return; }
  currentUser = { type:'consumer', name, phone, loc };
  document.getElementById('consumerInitial').textContent = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('consumerChipName').textContent = name;
  document.getElementById('consumerChipLoc').textContent = '📍 ' + loc;
  
  hideAll(); document.getElementById('consumerDash').classList.remove('hidden');
  renderActiveFarmers(); renderProducts('all'); renderGroupBuys(); updateCartBadge();
}

function renderActiveFarmers() {
  const grid = document.getElementById('farmerNetworkGrid');
  const farmers = JSON.parse(localStorage.getItem('activeFarmers') || '[]');
  if (farmers.length === 0) return grid.innerHTML = '<div style="color:var(--bark); text-align:center; grid-column:1/-1;">No farmers yet.</div>';
  grid.innerHTML = farmers.map(f => `<div style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 6px 16px var(--shadow); border: 1.5px solid rgba(90,127,69,0.15);"><div style="display:flex; align-items:center; gap: 14px; margin-bottom:16px;"><div class="user-avatar" style="width:42px; height:42px; font-size:18px;">👨‍🌾</div><div><div style="font-weight:700; font-size:18px;">${f.name}</div><div style="font-size:12px; color:var(--sage);">📍 ${f.loc}</div></div></div><div style="font-size:14px; font-weight: 500; color:var(--bark); background:var(--cream); padding:10px; border-radius:12px;">📞 ${f.phone}</div></div>`).join('');
}

function filterProducts(cat, btn) {
  allFilter = cat;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active');
  renderProducts(cat);
}

function renderProducts(filter) {
  const grid = document.getElementById('productGrid'); grid.innerHTML = '';
  const cats = filter === 'all' ? ['veg','fruit','flower'] : [filter];
  let count = 0;
  cats.forEach((cat, ci) => {
    const products = JSON.parse(localStorage.getItem(cat) || '[]');
    products.forEach((p, pi) => {
      if(p.qty <= 0) return;
      count++;
      let buyButton = `<button class="btn-primary green" style="padding: 12px; font-size: 14px;" onclick="addToCart('${cat}', ${pi})">Add to Cart</button>`;
      let groupButton = p.min > 1 ? `<button class="btn-secondary" style="width:100%; margin-top:8px; justify-content:center;" onclick="startPledge('${cat}', ${pi}, null)">🧺 Start Group Buy</button>` : '';

      grid.innerHTML += `
        <div class="product-card" style="animation-delay: ${(ci*3+pi)*0.07}s">
          <div class="product-thumb ${cat}">${getEmoji(p.name, cat)}</div>
          <div class="product-info">
            <div class="product-name">${p.name}</div>
            <div class="product-price">₹${p.price}<span>/kg</span></div>
            <div class="product-meta">📦 ${p.qty} kg avail · Min: ${p.min} kg</div>
            <div class="product-meta" style="color: var(--leaf); font-weight: 500;">📍 Farm: ${p.loc}</div>
            <div style="margin-top: auto; padding-top: 14px;">${buyButton}${groupButton}</div>
          </div>
        </div>
      `;
    });
  });
  if(count === 0) grid.innerHTML = `<div class="empty-state"><div class="empty-emoji">🌱</div><div class="empty-title">No produce here yet</div></div>`;
}

/* ─── GROUP BUY LOGIC ─── */
function startPledge(cat, index, gbId) {
  activePledgeData = { cat, index, gbId };
  document.getElementById('pledgeQtyInput').value = '';
  document.getElementById('pledgeOverlay').classList.remove('hidden');
}

function confirmPledge() {
  const qty = parseInt(document.getElementById('pledgeQtyInput').value);
  if(isNaN(qty) || qty <= 0) { showToast('⚠️ Enter a valid kg amount'); return; }

  const { cat, index, gbId } = activePledgeData;
  let products = JSON.parse(localStorage.getItem(cat) || '[]');
  let product = products[index];
  if(!product || product.qty < qty) { showToast('⚠️ Not enough stock on farm!'); return; }

  let groupBuys = JSON.parse(localStorage.getItem('groupBuys') || '[]');
  let activeGB = null;

  if (gbId) {
    activeGB = groupBuys.find(g => g.id === gbId);
  } else {
    activeGB = groupBuys.find(g => g.status === 'open' && g.productId === product.id);
    if(!activeGB) {
      activeGB = {
        id: 'GB-' + Date.now(), productId: product.id, cat: cat, pIndex: index, productName: product.name,
        price: product.price, targetQty: product.min, farmerName: product.farmerName, farmerLoc: product.loc,
        farmerPhone: product.phone, status: 'open', participants: []
      };
      groupBuys.push(activeGB);
    }
  }

  let currentTotal = activeGB.participants.reduce((sum, p) => sum + p.qty, 0);
  if(currentTotal + qty > product.qty) { showToast('⚠️ Exceeds total available farm stock!'); return; }

  activeGB.participants.push({ name: currentUser.name, phone: currentUser.phone, loc: currentUser.loc, qty: qty });
  currentTotal += qty;

  if(currentTotal >= activeGB.targetQty) {
    activeGB.status = 'completed';
    executeGroupBuyOrder(activeGB, product);
    showToast('🎉 Basket Goal Reached! Order dispatched.');
  } else {
    showToast('🧺 Pledged successfully! Tell neighbors to join.');
  }

  localStorage.setItem('groupBuys', JSON.stringify(groupBuys));
  document.getElementById('pledgeOverlay').classList.add('hidden');
  renderGroupBuys();
}

function renderGroupBuys() {
  const grid = document.getElementById('groupBuyGrid');
  const groupBuys = JSON.parse(localStorage.getItem('groupBuys') || '[]');
  const active = groupBuys.filter(g => g.status === 'open');

  if(active.length === 0) {
    grid.innerHTML = '<div style="color:var(--bark); grid-column:1/-1; text-align:center; padding: 20px;">No active community baskets right now. Start one!</div>';
    return;
  }

  grid.innerHTML = active.map(gb => {
    let currentTotal = gb.participants.reduce((sum, p) => sum + p.qty, 0);
    let progress = Math.min((currentTotal / gb.targetQty) * 100, 100);
    
    return `
      <div class="product-card" style="padding: 20px;">
        <div style="font-weight: 700; font-size: 18px; color: var(--soil); margin-bottom: 4px;">${gb.productName}</div>
        <div style="font-size: 14px; color: var(--sage);">From Farm: ${gb.farmerName} (${gb.farmerLoc})</div>
        
        <div class="progress-bg"><div class="progress-fill" style="width: ${progress}%"></div></div>
        <div style="font-size: 13px; font-weight:600; display:flex; justify-content:space-between; margin-bottom: 16px;">
          <span style="color: var(--leaf)">${currentTotal}kg Pledged</span>
          <span style="color: var(--bark)">Goal: ${gb.targetQty}kg</span>
        </div>
        
        <button class="btn-primary amber" style="padding: 10px;" onclick="startPledge('${gb.cat}', ${gb.pIndex}, '${gb.id}')">Join Basket (+kg)</button>
      </div>
    `;
  }).join('');
}

function executeGroupBuyOrder(gb, productData) {
  let products = JSON.parse(localStorage.getItem(gb.cat) || '[]');
  let currentTotal = gb.participants.reduce((sum, p) => sum + p.qty, 0);
  if(products[gb.pIndex]) products[gb.pIndex].qty -= currentTotal;
  localStorage.setItem(gb.cat, JSON.stringify(products));

  let jobs = JSON.parse(localStorage.getItem('logisticsJobs') || '[]');
  let drops = gb.participants.map(p => `${p.name} (${p.qty}kg) - ${p.loc}`).join(' | ');
  let extraFee = (gb.participants.length - 1) * 20;

  jobs.unshift({
    id: 'GBORD-' + Math.floor(1000 + Math.random() * 9000), buyerName: 'Community Group Buy',
    buyerPhone: gb.participants[0].phone, dropLoc: 'Multiple Drops: ' + drops, pickups: [gb.farmerLoc],
    summary: `${currentTotal}kg ${gb.productName} (Splitting to ${gb.participants.length} buyers)`,
    deliveryFee: DELIVERY_FEE + extraFee, status: 'pending'
  });
  localStorage.setItem('logisticsJobs', JSON.stringify(jobs));
  renderProducts(allFilter);
}

/* ─── NORMAL CART LOGIC ─── */
function addToCart(cat, index) {
  const p = JSON.parse(localStorage.getItem(cat) || '[]')[index];
  if(p.min > 1) { showToast(`⚠️ This item requires minimum ${p.min}kg bulk purchase. Use Group Buy!`); return; }
  
  let item = cart.find(i => i.cat === cat && i.index === index);
  if (item) { if(item.orderQty < p.qty) { item.orderQty++; showToast(`🛒 Qty increased`); } } 
  else { cart.push({ ...p, cat, index, orderQty: 1 }); showToast(`🛒 Added`); }
  updateCartBadge();
}
function updateCartBadge() { document.getElementById('cartCountBadge').textContent = cart.reduce((s, i) => s + i.orderQty, 0); }
function toggleCartModal() { const o = document.getElementById('cartOverlay'); if(o.classList.contains('hidden')) { renderCartItems(); o.classList.remove('hidden'); } else { o.classList.add('hidden'); } }

function renderCartItems() {
  const body = document.getElementById('cartBody');
  if(cart.length === 0) { body.innerHTML = `<div style="text-align:center; padding: 60px 0;">🛒 Cart empty.</div>`; return; }
  cartSubtotal = 0;
  body.innerHTML = cart.map((item, i) => {
    cartSubtotal += item.price * item.orderQty;
    return `<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
        <div><div style="font-weight: 700; font-size: 16px;">${item.name}</div><div style="font-size: 14px; color: var(--sage);">₹${item.price}/kg</div></div>
        <div style="display: flex; align-items: center; gap: 12px;"><button class="qty-btn" onclick="changeQty(${i}, -1)">-</button><span style="font-weight: 700;">${item.orderQty}</span><button class="qty-btn" onclick="changeQty(${i}, 1)">+</button></div>
      </div>`;
  }).join('');
  document.getElementById('cartSubtotalDisplay').textContent = '₹' + cartSubtotal.toFixed(2);
  document.getElementById('cartTotalDisplay').textContent = '₹' + (cartSubtotal + DELIVERY_FEE).toFixed(2);
}

function changeQty(i, delta) { cart[i].orderQty += delta; if (cart[i].orderQty <= 0) cart.splice(i, 1); updateCartBadge(); renderCartItems(); }
function checkout() { if(cart.length === 0) return; document.getElementById('cartOverlay').classList.add('hidden'); document.getElementById('paymentOverlay').classList.remove('hidden'); }

function processPayment() {
  cart.forEach(item => {
    let prods = JSON.parse(localStorage.getItem(item.cat) || '[]');
    if(prods[item.index]) prods[item.index].qty -= item.orderQty;
    localStorage.setItem(item.cat, JSON.stringify(prods));
  });
  
  const pickups = [...new Set(cart.map(i => i.loc))]; 
  let jobs = JSON.parse(localStorage.getItem('logisticsJobs') || '[]');
  jobs.unshift({
    id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
    buyerName: currentUser.name, buyerPhone: currentUser.phone, dropLoc: currentUser.loc,
    pickups: pickups, summary: cart.map(i => `${i.orderQty}kg ${i.name}`).join(', '),
    deliveryFee: DELIVERY_FEE, status: 'pending'
  });
  localStorage.setItem('logisticsJobs', JSON.stringify(jobs));

  cart = []; updateCartBadge(); document.getElementById('paymentOverlay').classList.add('hidden'); renderProducts(allFilter);
  showToast(`✅ Order placed! Requesting driver...`);
}

/* ─── REAL-TIME TRACKING CONSUMER LOGIC ─── */
function openTracking() {
  let jobs = JSON.parse(localStorage.getItem('logisticsJobs') || '[]');
  let myActive = jobs.filter(j => j.buyerPhone === currentUser.phone && j.status === 'accepted');
  
  if(myActive.length === 0) {
    showToast('No active deliveries on the way right now.');
    return;
  }
  
  document.getElementById('trackingOverlay').classList.remove('hidden');
  let jobId = myActive[myActive.length - 1].id;
  let driverName = myActive[myActive.length - 1].driverName;
  
  document.getElementById('trackStatusText').innerHTML = `🛵 <strong>${driverName}</strong> is currently on the way...`;

  consumerTrackLoop = setInterval(() => {
    let trackData = localStorage.getItem('track_' + jobId);
    let mapMarker = document.getElementById('liveDriverMarker');
    
    if(trackData) {
      let td = JSON.parse(trackData);
      mapMarker.style.left = td.pos + '%'; 
    } else {
      mapMarker.style.left = '5%'; 
    }
  }, 1000);
}

function closeTrackingModal(e) {
  if(e.target.id === 'trackingOverlay' || e.target.tagName === 'BUTTON') {
    document.getElementById('trackingOverlay').classList.add('hidden');
    if(consumerTrackLoop) clearInterval(consumerTrackLoop);
  }
}

/* ─── DRIVER FLOW ─── */
function proceedDriver() {
  const name = document.getElementById('driverName').value.trim();
  const phone = document.getElementById('driverPhone').value.trim();
  const pass = document.getElementById('driverPassword').value.trim();
  const vehicle = document.getElementById('driverVehicle').value;
  if (!name || !/^\d{10}$/.test(phone) || !pass) { showToast('⚠️ Check details'); return; }
  
  let activeDrivers = JSON.parse(localStorage.getItem('activeDrivers') || '[]');
  let existing = activeDrivers.find(d => d.phone === phone);
  if (existing && existing.password !== pass) { showToast('❌ Incorrect password!'); return; }
  if (!existing) { activeDrivers.push({ name, phone, vehicle, password: pass }); localStorage.setItem('activeDrivers', JSON.stringify(activeDrivers)); }

  currentUser = { type:'driver', name, phone, vehicle };
  document.getElementById('driverInitial').textContent = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('driverChipName').textContent = name;
  document.getElementById('driverChipVehicle').textContent = vehicle;
  hideAll(); document.getElementById('driverDash').classList.remove('hidden');
  showToast('🛵 Online!'); renderDriverJobs();
}

function switchDriverTab(tab) { driverViewTab = tab; document.querySelectorAll('#driverDash .filter-tab').forEach(t=>t.classList.remove('active')); event.target.classList.add('active'); renderDriverJobs(); }

function renderDriverJobs() {
  const container = document.getElementById('driverJobsContainer');
  const jobs = JSON.parse(localStorage.getItem('logisticsJobs') || '[]');
  let filtered = driverViewTab === 'available' ? jobs.filter(j => j.status === 'pending') : jobs.filter(j => j.driverPhone === currentUser.phone);

  if (filtered.length === 0) { container.innerHTML = `<div class="empty-state"><div class="empty-emoji">📦</div><div class="empty-title">No jobs found</div></div>`; return; }

  container.innerHTML = filtered.map(job => {
    let btn = job.status === 'pending' ? `<button class="btn-primary blue" style="padding:10px" onclick="acceptJob('${job.id}')">Accept Delivery</button>` 
            : job.status === 'accepted' ? `<div style="color:var(--sage); font-size: 13px; font-weight: bold; margin-bottom: 8px; text-align: center;">📍 Broadcasting Live Location to Buyer...</div><button class="btn-primary green" style="padding:10px" onclick="completeJob('${job.id}')">Mark Delivered ✓</button>`
            : `<div style="text-align:center; padding:10px; background:var(--moss); border-radius:10px; color:var(--sage); font-weight:bold;">✓ Completed</div>`;
    
    return `
      <div class="job-card ${job.status==='completed'?'completed':''}">
        <div class="job-header"><div class="job-id">${job.id}</div><div class="job-fee">Earn: ₹${job.deliveryFee}</div></div>
        <div class="job-route">
          <div class="job-stop"><div class="job-icon pickup">↑</div><div class="job-details"><strong>Pickup from:</strong> ${job.pickups.join(' & ')}</div></div>
          <div style="margin-left: 11px; border-left: 2px dashed #cbd5e1; height: 16px; margin-bottom: 10px;"></div>
          <div class="job-stop"><div class="job-icon drop">↓</div><div class="job-details"><strong>Drop to: ${job.buyerName}</strong><br><span style="font-size:12px;">${job.dropLoc}</span><br><span style="color:var(--ocean); font-size:12px;">📞 ${job.buyerPhone}</span></div></div>
        </div>
        <div style="background: var(--cream); padding: 12px; border-radius: 12px; font-size: 13px; margin-bottom: 16px;"><strong>Package:</strong> ${job.summary}</div>
        ${btn}
      </div>
    `;
  }).join('');
}

function acceptJob(id) { 
  let jobs = JSON.parse(localStorage.getItem('logisticsJobs')||'[]'); 
  let j = jobs.find(x=>x.id===id); 
  if(j) { 
    j.status='accepted'; j.driverName=currentUser.name; j.driverPhone=currentUser.phone; 
    localStorage.setItem('logisticsJobs', JSON.stringify(jobs)); 
    switchDriverTab('myjobs'); 
    
    let pos = 5; 
    driverTrackingLoops[id] = setInterval(() => {
      pos += Math.random() * 6; 
      if(pos > 85) pos = 85; 
      localStorage.setItem('track_' + id, JSON.stringify({ pos, time: Date.now() }));
    }, 2500);
  } 
}

function completeJob(id) { 
  let jobs = JSON.parse(localStorage.getItem('logisticsJobs')||'[]'); 
  let j = jobs.find(x=>x.id===id); 
  if(j){ 
    j.status='completed'; 
    localStorage.setItem('logisticsJobs', JSON.stringify(jobs)); 
    renderDriverJobs(); 
    showToast('🎉 Earned ₹'+j.deliveryFee); 
    
    if(driverTrackingLoops[id]) clearInterval(driverTrackingLoops[id]);
    localStorage.removeItem('track_' + id);
  } 
}

/* ─── FARMER PROFILE & STOCK MANAGEMENT ─── */
function openFarmerProfile() {
  document.getElementById('farmerProfileOverlay').classList.remove('hidden');
  renderFarmerStock();
  renderFarmerDeliveries();
}

function renderFarmerStock() {
  const container = document.getElementById('farmerStockList');
  let myStock = [];
  
  ['veg', 'fruit', 'flower'].forEach(cat => {
    let products = JSON.parse(localStorage.getItem(cat) || '[]');
    let farmerProducts = products.filter(p => p.phone === currentUser.phone);
    myStock = myStock.concat(farmerProducts);
  });

  if (myStock.length === 0) {
    container.innerHTML = `<div style="color: var(--bark); font-size: 14px; text-align: center; padding: 20px 0; background: white; border-radius: 16px;">No active items listed. Start adding produce!</div>`;
    return;
  }

  container.innerHTML = myStock.map(p => `
    <div style="background: white; border: 1px solid rgba(90,127,69,0.15); padding: 16px 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <div>
        <div style="font-weight: 700; color: var(--soil); font-size: 16px; margin-bottom: 4px;">${p.name}</div>
        <div style="font-size: 13px; color: var(--sage); font-weight: 500;">₹${p.price} / kg</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: ${p.qty > 0 ? 'var(--leaf)' : 'var(--danger)'}; font-size: 18px;">${p.qty} kg</div>
        <div style="font-size: 11px; color: var(--bark); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">In Stock</div>
      </div>
    </div>
  `).join('');
}

function renderFarmerDeliveries() {
  const container = document.getElementById('farmerDeliveryList');
  let jobs = JSON.parse(localStorage.getItem('logisticsJobs') || '[]');
  
  let myOrders = jobs.filter(j => j.pickups.includes(currentUser.loc));

  if (myOrders.length === 0) {
    container.innerHTML = `<div style="color: var(--bark); font-size: 14px; text-align: center; padding: 20px 0; background: white; border-radius: 16px;">No recent orders or deliveries.</div>`;
    return;
  }

  container.innerHTML = myOrders.map(job => {
    let statusColor = job.status === 'completed' ? 'var(--sage)' : job.status === 'accepted' ? 'var(--ocean)' : '#d4a853';
    let statusBg = job.status === 'completed' ? 'rgba(90,127,69,0.1)' : job.status === 'accepted' ? 'rgba(43,108,176,0.1)' : 'rgba(212,168,83,0.1)';
    let statusText = job.status === 'completed' ? '✓ Delivered' : job.status === 'accepted' ? '🛵 Driver Assigned' : '⏳ Pending Pickup';
    
    return `
      <div class="job-card" style="margin-bottom: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div class="job-header" style="margin-bottom: 12px; padding-bottom: 12px;">
          <div class="job-id">${job.id}</div>
          <div style="font-weight: 700; font-size: 12px; color: ${statusColor}; background: ${statusBg}; padding: 6px 12px; border-radius: 20px;">${statusText}</div>
        </div>
        <div style="font-size: 14px; color: var(--soil); margin-bottom: 8px;"><strong>Items:</strong> ${job.summary}</div>
        <div style="font-size: 13px; color: var(--bark); display: flex; justify-content: space-between;">
          <span><strong>Buyer:</strong> ${job.buyerName}</span>
          ${job.driverName ? `<span style="color: var(--ocean);"><strong>Driver:</strong> ${job.driverName}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* ─── ROLE SWITCHING LOGIC ─── */
function switchToFarmer() {
  document.getElementById('farmerName').value = currentUser.name || '';
  document.getElementById('farmerPhone').value = currentUser.phone || '';
  document.getElementById('farmerLocInput').value = currentUser.loc || '';
  
  showFarmerLogin();
  showToast('👨‍🌾 Enter or create a password to open your Farm Portal');
}

function switchToConsumer() {
  document.getElementById('consumerName').value = currentUser.name || '';
  document.getElementById('consumerPhone').value = currentUser.phone || '';
  document.getElementById('consumerLocation').value = currentUser.loc || '';
  
  proceedConsumer();
  showToast('🛒 Switched to Buyer Market');
}

// Init checks
if(!localStorage.getItem('activeFarmers')) localStorage.setItem('activeFarmers', '[]');
if(!localStorage.getItem('activeDrivers')) localStorage.setItem('activeDrivers', '[]');
if(!localStorage.getItem('logisticsJobs')) localStorage.setItem('logisticsJobs', '[]');
if(!localStorage.getItem('groupBuys')) localStorage.setItem('groupBuys', '[]');