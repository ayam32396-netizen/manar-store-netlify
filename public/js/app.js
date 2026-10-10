let allProducts = [];
let scrollObserver;

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  const currentYearEl = document.getElementById('current-year');
  if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

  // Load store config (e.g. WhatsApp number)
  loadConfig();

  // Initialize language UI
  initLanguageUI();

  // Language switch event
  const langSwitch = document.getElementById('lang-switch');
  if (langSwitch) {
    langSwitch.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      setLanguage(newLang);
      updateLangSwitchText();
      
      const activeCard = document.querySelector('.organic-category-card.active');
      const currentCategory = activeCard ? activeCard.dataset.category : 'all';
      renderProducts(currentCategory);
      renderCart();
      if (document.getElementById('checkout-section').style.display === 'block') {
        renderCheckoutSummary();
      }
    });
  }

  // Mobile Menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');
  if (mobileBtn && mainNav) {
    mobileBtn.addEventListener('click', () => {
      mainNav.classList.toggle('open');
    });
  }

  // Organic Category Cards Click Handlers
  document.querySelectorAll('.organic-category-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category || 'all';
      selectCategory(cat);
      
      const prodSec = document.getElementById('products-section');
      if (prodSec) {
        prodSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Category Filter Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category || 'all';
      selectCategory(cat);
    });
  });

  // Nav Links
  document.querySelectorAll('.nav-link[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (mainNav) mainNav.classList.remove('open');
      
      const cat = e.currentTarget.dataset.category || 'all';
      selectCategory(cat);
      
      // If in checkout/confirmation, return to main catalog
      document.getElementById('checkout-section').style.display = 'none';
      document.getElementById('confirmation-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      
      const prodSec = document.getElementById('products-section');
      if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Footer Category Links
  document.querySelectorAll('.footer-cat-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = e.currentTarget.dataset.category || 'all';
      selectCategory(cat);
      
      document.getElementById('checkout-section').style.display = 'none';
      document.getElementById('confirmation-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      
      const prodSec = document.getElementById('products-section');
      if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Home Nav Link & Logo Link
  const homeLink = document.querySelector('.nav-link[data-i18n="nav_home"]');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (mainNav) mainNav.classList.remove('open');
      selectCategory('all');
      document.getElementById('checkout-section').style.display = 'none';
      document.getElementById('confirmation-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const logoLink = document.getElementById('logo-link');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (mainNav) mainNav.classList.remove('open');
      selectCategory('all');
      document.getElementById('checkout-section').style.display = 'none';
      document.getElementById('confirmation-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Cart Handlers
  const cartToggle = document.getElementById('cart-toggle');
  if (cartToggle) cartToggle.addEventListener('click', openCart);

  const closeCartBtn = document.getElementById('close-cart-btn');
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

  const cartOverlay = document.getElementById('cart-overlay');
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  
  cart.onUpdate = renderCart;
  cart.updateUI();

  // Checkout Flow Handlers
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showCheckout();
    });
  }

  const backToCartBtn = document.getElementById('back-to-cart-btn');
  if (backToCartBtn) {
    backToCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideCheckout();
    });
  }
  
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', submitOrder);
  }

  const continueShoppingBtn = document.getElementById('continue-shopping-btn');
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', () => {
      document.getElementById('confirmation-section').style.display = 'none';
      document.getElementById('checkout-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      selectCategory('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  const heroShopBtn = document.getElementById('hero-shop-btn');
  if (heroShopBtn) {
    heroShopBtn.addEventListener('click', () => {
      const prodSec = document.getElementById('products-section');
      if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Product Modal Handlers
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);

  const prodModal = document.getElementById('product-modal');
  if (prodModal) {
    prodModal.addEventListener('click', (e) => {
      if (e.target.id === 'product-modal') closeProductModal();
    });
  }

  // Init scroll observer
  initScrollReveal();

  // Load products from API
  await fetchProducts();
}

function initLanguageUI() {
  updateLangSwitchText();
}

function updateLangSwitchText() {
  const langText = document.getElementById('lang-text');
  if (langText) {
    langText.textContent = currentLang === 'ar' ? 'English' : 'العربية';
  }
}

function selectCategory(category) {
  // Sync organic cards
  document.querySelectorAll('.organic-category-card').forEach(c => {
    c.classList.toggle('active', c.dataset.category === category);
  });

  // Sync category tabs
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.category === category);
  });

  // Sync nav links
  document.querySelectorAll('.nav-link[data-category]').forEach(l => {
    l.classList.toggle('active', l.dataset.category === category);
  });

  renderProducts(category);
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config.php');
    if (res.ok) {
      const config = await res.json();
      if (config.whatsapp_number) {
        const cleanNumber = config.whatsapp_number.replace(/[^0-9]/g, '');
        const waLink = `https://wa.me/${cleanNumber}`;
        const waFloat = document.getElementById('whatsapp-btn');
        if (waFloat) waFloat.href = waLink;
        const footerWa = document.getElementById('footer-wa-link');
        if (footerWa) footerWa.href = waLink;
        document.querySelectorAll('a[href*="wa.me"]').forEach(a => a.href = waLink);
      }
    }
  } catch (e) {
    console.warn('Could not load config from API:', e);
  }
}

async function fetchProducts() {
  const loading = document.getElementById('loading-overlay');
  if (loading) loading.style.display = 'flex';

  try {
    const res = await fetch('/api/products.php');
    if (res.ok) {
      allProducts = await res.json();
    } else {
      console.error('Failed to fetch products from API');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    if (loading) loading.style.display = 'none';
    renderProducts('all');
  }
}

function renderProducts(category) {
  const grid = document.getElementById('products-grid');
  const msg = document.getElementById('no-products-msg');
  if (!grid) return;
  
  const filtered = (!category || category === 'all')
    ? allProducts
    : allProducts.filter(p => p.category === category);
  
  grid.innerHTML = '';
  
  if (filtered.length === 0) {
    grid.style.display = 'none';
    if (msg) msg.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  if (msg) msg.style.display = 'none';
  
  filtered.forEach(product => {
    grid.insertAdjacentHTML('beforeend', renderProductCard(product));
  });
  
  if (scrollObserver) {
    document.querySelectorAll('.product-card.reveal').forEach(el => scrollObserver.observe(el));
  }
}

function renderProductCard(product) {
  const outOfStockLabel = t('out_of_stock');
  const addCartLabel = product.stock === 0 ? outOfStockLabel : t('add_to_cart');
  const disabledAttr = product.stock === 0 ? 'disabled' : '';
  const currency = t('currency');
  
  const imgSrc = product.image.includes('/') ? product.image : `/uploads/${product.image}`;
  const imgError = `onerror="this.src='/assets/logo.jpg'"`;

  let badges = '';
  if (product.stock === 0) {
    badges += `<div class="out-of-stock-badge">${outOfStockLabel}</div>`;
  } else if (product.discount && product.discount > 0) {
    badges += `<div class="discount-badge">${t('discount')} -${product.discount} ${currency}</div>`;
  }
  
  let priceHTML = '';
  if (product.discount && product.discount > 0) {
    priceHTML = `
      <span class="price-original">${product.price} ${currency}</span>
      <span class="price-final">${product.final_price} ${currency}</span>
    `;
  } else {
    priceHTML = `<span class="price-final">${product.final_price} ${currency}</span>`;
  }

  return `
    <div class="product-card reveal" data-id="${product.id}">
      <div class="product-image-wrap" onclick="openProductModal(${product.id})">
        <img src="${imgSrc}" alt="${escapeHtml(product.name)}" loading="lazy" ${imgError}>
        ${badges}
      </div>
      <div class="product-info">
        <h3 class="product-name" onclick="openProductModal(${product.id})">${escapeHtml(product.name)}</h3>
        ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
        <div class="product-price">${priceHTML}</div>
        <button class="btn btn-primary btn-block btn-add-cart" onclick="addToCart(${product.id})" ${disabledAttr}>
          ${addCartLabel}
        </button>
      </div>
    </div>
  `;
}

function addToCart(id, qty = 1) {
  const p = allProducts.find(x => x.id === id);
  if (p && p.stock > 0) {
    cart.addItem(p, qty);
    openCart();
  }
}

function openProductModal(id) {
  const product = allProducts.find(x => x.id === id);
  if (!product) return;
  
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('modal-body');
  const currency = t('currency');
  
  const imgSrc = product.image.includes('/') ? product.image : `/uploads/${product.image}`;
  const imgError = `onerror="this.src='/assets/logo.jpg'"`;
  
  let priceHTML = '';
  if (product.discount && product.discount > 0) {
    priceHTML = `
      <span class="price-original">${product.price} ${currency}</span>
      <span class="price-final">${product.final_price} ${currency}</span>
    `;
  } else {
    priceHTML = `<span class="price-final">${product.final_price} ${currency}</span>`;
  }

  const disabled = product.stock === 0 ? 'disabled' : '';
  const btnLabel = product.stock === 0 ? t('out_of_stock') : t('add_to_cart');
  
  body.innerHTML = `
    <div class="modal-product">
      <div class="modal-product-img">
        <img src="${imgSrc}" alt="${escapeHtml(product.name)}" ${imgError}>
      </div>
      <div class="modal-product-info">
        <h2>${escapeHtml(product.name)}</h2>
        ${product.description ? `<p class="product-desc" style="margin-bottom: 1.5rem; font-size: 1.05rem; line-height: 1.6;">${escapeHtml(product.description)}</p>` : ''}
        <div class="product-price">${priceHTML}</div>
        <div class="qty-selector" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <label style="font-weight: 700;">${t('quantity')}:</label>
          <button class="qty-btn" type="button" onclick="const q = document.getElementById('modal-qty'); if (q.value > 1) q.value--;">-</button>
          <input type="number" id="modal-qty" value="1" min="1" max="${product.stock || 1}" style="width: 60px; text-align: center; height: 36px; border-radius: 8px; border: 1px solid var(--border-color);" ${disabled}>
          <button class="qty-btn" type="button" onclick="const q = document.getElementById('modal-qty'); if (parseInt(q.value) < ${product.stock || 1}) q.value++;">+</button>
        </div>
        <button class="btn btn-primary btn-large btn-block" onclick="addToCartFromModal(${product.id})" ${disabled}>${btnLabel}</button>
      </div>
    </div>
  `;
  
  modal.classList.add('open');
}

window.addToCartFromModal = function(id) {
  const qtyInput = document.getElementById('modal-qty');
  const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
  addToCart(id, qty);
  closeProductModal();
};

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('open');
}

function openCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (!sidebar || !overlay) return;
  
  sidebar.classList.add('open');
  overlay.style.display = 'block';
  overlay.style.pointerEvents = 'auto';
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });
  renderCart();
}

function closeCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (!sidebar || !overlay) return;
  
  sidebar.classList.remove('open');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 300);
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const checkoutBtn = document.getElementById('checkout-btn');
  const currency = t('currency');
  if (!container) return;
  
  if (cart.items.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 48px 20px; color: var(--text-muted);">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.8" fill="none" style="margin-bottom: 12px; opacity: 0.7;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <p style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">${t('cart_empty')}</p>
        <p style="font-size: 0.9rem;">${t('cart_empty_sub')}</p>
      </div>
    `;
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    if (checkoutBtn) checkoutBtn.disabled = false;
    container.innerHTML = cart.items.map(item => {
      const imgSrc = item.image.includes('/') ? item.image : `/uploads/${item.image}`;
      return `
        <div class="cart-item">
          <img src="${imgSrc}" onerror="this.src='/assets/logo.jpg'" alt="${escapeHtml(item.name)}">
          <div class="cart-item-info">
            <h4>${escapeHtml(item.name)}</h4>
            <div style="color: var(--primary-color); font-weight: 800;">${item.final_price} ${currency}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" type="button" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
              <span style="min-width: 24px; text-align: center; font-weight: 700;">${item.quantity}</span>
              <button class="qty-btn" type="button" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
              <button class="remove-btn" type="button" onclick="cart.removeItem(${item.id})" title="${t('remove')}">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Totals
  const subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) subtotalEl.textContent = `${cart.getSubtotal()} ${currency}`;
  
  const disc = cart.getTotalDiscount();
  const discRow = document.getElementById('cart-discount-row');
  const discEl = document.getElementById('cart-discount');
  if (discRow && discEl) {
    if (disc > 0) {
      discRow.style.display = 'flex';
      discEl.textContent = `-${disc} ${currency}`;
    } else {
      discRow.style.display = 'none';
    }
  }

  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = `${cart.getTotal()} ${currency}`;
}

function showCheckout() {
  if (cart.items.length === 0) {
    alert(currentLang === 'ar' ? 'السلة فارغة. أضف بعض المنتجات للبدء!' : 'Your cart is empty. Add products to get started!');
    return;
  }

  closeCart();
  
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('confirmation-section').style.display = 'none';
  document.getElementById('checkout-section').style.display = 'block';
  
  renderCheckoutSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideCheckout() {
  document.getElementById('checkout-section').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
  openCart();
}

function renderCheckoutSummary() {
  const currency = t('currency');
  const itemsContainer = document.getElementById('checkout-items');
  if (!itemsContainer) return;

  itemsContainer.innerHTML = cart.items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
      <div>
        <span style="font-weight: 700;">${escapeHtml(item.name)}</span>
        <span style="color: var(--text-muted); font-size: 0.9rem;"> × ${item.quantity}</span>
      </div>
      <strong style="color: var(--primary-color);">${item.final_price * item.quantity} ${currency}</strong>
    </div>
  `).join('');

  const subtotalEl = document.getElementById('checkout-subtotal');
  if (subtotalEl) subtotalEl.textContent = `${cart.getSubtotal()} ${currency}`;
  
  const disc = cart.getTotalDiscount();
  const discRow = document.getElementById('checkout-discount-row');
  const discEl = document.getElementById('checkout-discount');
  if (discRow && discEl) {
    if (disc > 0) {
      discRow.style.display = 'flex';
      discEl.textContent = `-${disc} ${currency}`;
    } else {
      discRow.style.display = 'none';
    }
  }

  const totalEl = document.getElementById('checkout-total');
  if (totalEl) totalEl.textContent = `${cart.getTotal()} ${currency}`;
}

async function submitOrder(e) {
  e.preventDefault();
  
  if (cart.items.length === 0) {
    alert(currentLang === 'ar' ? 'السلة فارغة' : 'Your cart is empty');
    hideCheckout();
    return;
  }

  const form = document.getElementById('checkout-form');
  const customer_name = form.customer_name.value.trim();
  const phone = form.phone.value.trim();
  const address = form.address.value.trim();

  if (!customer_name || !phone || !address) {
    alert(currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
    return;
  }

  const formData = {
    customer_name,
    phone,
    address,
    items: cart.items.map(i => ({ product_id: i.id, quantity: i.quantity }))
  };

  const loading = document.getElementById('loading-overlay');
  if (loading) loading.style.display = 'flex';

  try {
    const res = await fetch('/api/orders.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await res.json();
    if (res.ok && data.success) {
      // Clear cart
      cart.clear();
      form.reset();
      
      document.getElementById('checkout-section').style.display = 'none';
      document.getElementById('confirmation-section').style.display = 'block';
      document.getElementById('confirmed-order-number').textContent = `${data.order_number || ('#MES-' + data.order_id)}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert(data.error || (currentLang === 'ar' ? 'حدث خطأ أثناء إتمام الطلب' : 'Failed to place order'));
    }
  } catch (err) {
    console.error('Order submission error:', err);
    alert(currentLang === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة مرة أخرى.' : 'Network error. Please try again.');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
