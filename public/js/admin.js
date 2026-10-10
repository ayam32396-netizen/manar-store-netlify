/**
 * Admin Dashboard Logic - Manar Elhady Store
 */

// State
let token = localStorage.getItem('admin_token');
let currentLang = 'ar';
let productsList = [];
let ordersList = [];
let deleteId = null;
let currentProductFilter = 'all'; // 'all' or 'out-of-stock'

// Translations
const i18n = {
  ar: {
    login_title: "لوحة التحكم",
    login_btn: "تسجيل الدخول",
    nav_dashboard: "لوحة التحكم",
    nav_products: "المنتجات",
    nav_orders: "الطلبات",
    nav_settings: "الإعدادات",
    nav_logout: "تسجيل خروج",
    stat_total_orders: "إجمالي الطلبات",
    stat_new_orders: "طلبات جديدة",
    stat_total_sales: "إجمالي المبيعات",
    stat_total_products: "إجمالي المنتجات",
    stat_out_of_stock: "نفد المخزون",
    recent_orders: "أحدث الطلبات",
    col_order_num: "رقم الطلب",
    col_customer: "العميل",
    col_total: "الإجمالي",
    col_status: "الحالة",
    col_date: "التاريخ",
    btn_add_product: "إضافة منتج",
    col_product_name: "اسم المنتج",
    col_category: "القسم",
    col_price: "السعر",
    col_discount: "الخصم",
    col_stock: "المخزون",
    col_actions: "إجراءات",
    status_all: "الكل",
    status_new: "طلب جديد",
    status_confirmed: "تم التأكيد",
    status_preparing: "جاري التجهيز",
    status_shipped: "تم الشحن",
    status_delivered: "تم التسليم",
    status_cancelled: "ملغي",
    modal_add_product: "إضافة منتج جديد",
    modal_edit_product: "تعديل المنتج",
    label_name: "اسم المنتج",
    label_desc: "الوصف (اختياري)",
    label_price: "السعر (ج.م)",
    label_discount: "قيمة الخصم (ج.م) - اختياري",
    label_category: "القسم",
    label_stock: "المخزون",
    label_image: "صورة المنتج",
    cat_hair: "شعر",
    cat_skin: "بشرة",
    cat_body: "جسم",
    btn_cancel: "إلغاء",
    btn_save: "حفظ",
    modal_delete_title: "تأكيد الحذف",
    modal_delete_msg: "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.",
    btn_delete: "حذف",
    status_lbl_new: "طلب جديد",
    status_lbl_confirmed: "تم التأكيد",
    status_lbl_preparing: "جاري التجهيز",
    status_lbl_shipped: "تم الشحن",
    status_lbl_delivered: "تم التسليم",
    status_lbl_cancelled: "ملغي",
    phone: "رقم الهاتف:",
    address: "العنوان:",
    subtotal: "المجموع الفرعي:",
    discount: "الخصم:",
    currency: "ج.م",
    err_login: "خطأ في تسجيل الدخول. يرجى التحقق من البريد وكلمة المرور.",
    err_fetch: "حدث خطأ في جلب البيانات من السيرفر",
    success_add: "تمت إضافة المنتج بنجاح وحفظه في قاعدة البيانات",
    success_edit: "تم تعديل المنتج وتحديثه بنجاح",
    success_delete: "تم حذف المنتج بنجاح من قاعدة البيانات",
    success_status: "تم تحديث حالة الطلب بنجاح",
    settings_credentials_title: "بيانات تسجيل الدخول",
    settings_logo_title: "شعار المتجر (Logo)",
    label_username: "اسم المستخدم / Username",
    label_email: "البريد الإلكتروني / Email",
    label_current_password: "كلمة المرور الحالية",
    label_new_password: "كلمة المرور الجديدة (اختياري)",
    label_confirm_password: "تأكيد كلمة المرور الجديدة",
    btn_save_settings: "حفظ بيانات الدخول",
    label_upload_logo: "رفع شعار جديد",
    btn_save_logo: "تحديث الشعار",
    success_credentials: "تم تحديث بيانات الدخول بنجاح",
    success_logo: "تم تحديث شعار المتجر بنجاح"
  },
  en: {
    login_title: "Admin Dashboard",
    login_btn: "Login",
    nav_dashboard: "Dashboard",
    nav_products: "Products",
    nav_orders: "Orders",
    nav_settings: "Settings",
    nav_logout: "Logout",
    stat_total_orders: "Total Orders",
    stat_new_orders: "New Orders",
    stat_total_sales: "Total Sales",
    stat_total_products: "Total Products",
    stat_out_of_stock: "Out of Stock",
    recent_orders: "Recent Orders",
    col_order_num: "Order No.",
    col_customer: "Customer",
    col_total: "Total",
    col_status: "Status",
    col_date: "Date",
    btn_add_product: "Add Product",
    col_product_name: "Product Name",
    col_category: "Category",
    col_price: "Price",
    col_discount: "Discount",
    col_stock: "Stock",
    col_actions: "Actions",
    status_all: "All",
    status_new: "New Order",
    status_confirmed: "Confirmed",
    status_preparing: "Preparing",
    status_shipped: "Shipped",
    status_delivered: "Delivered",
    status_cancelled: "Cancelled",
    modal_add_product: "Add New Product",
    modal_edit_product: "Edit Product",
    label_name: "Product Name",
    label_desc: "Description (Optional)",
    label_price: "Price (EGP)",
    label_discount: "Discount (EGP) - Optional",
    label_category: "Category",
    label_stock: "Stock",
    label_image: "Product Image",
    cat_hair: "Hair",
    cat_skin: "Skin",
    cat_body: "Body",
    btn_cancel: "Cancel",
    btn_save: "Save",
    modal_delete_title: "Confirm Delete",
    modal_delete_msg: "Are you sure you want to delete this product? This action cannot be undone.",
    btn_delete: "Delete",
    status_lbl_new: "New Order",
    status_lbl_confirmed: "Confirmed",
    status_lbl_preparing: "Preparing",
    status_lbl_shipped: "Shipped",
    status_lbl_delivered: "Delivered",
    status_lbl_cancelled: "Cancelled",
    phone: "Phone:",
    address: "Address:",
    subtotal: "Subtotal:",
    discount: "Discount:",
    currency: "EGP",
    err_login: "Login failed. Please check your email and password.",
    err_fetch: "Error fetching data from server",
    success_add: "Product added successfully to database",
    success_edit: "Product updated successfully",
    success_delete: "Product deleted successfully from database",
    success_status: "Order status updated successfully",
    settings_credentials_title: "Login Credentials",
    settings_logo_title: "Store Logo",
    label_username: "Username",
    label_email: "Email",
    label_current_password: "Current Password",
    label_new_password: "New Password (Optional)",
    label_confirm_password: "Confirm New Password",
    btn_save_settings: "Save Credentials",
    label_upload_logo: "Upload New Logo",
    btn_save_logo: "Update Logo",
    success_credentials: "Login credentials updated successfully",
    success_logo: "Store logo updated successfully"
  }
};

// DOM Elements
const loginPage = document.getElementById('login-page');
const adminApp = document.getElementById('admin-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminEmailDisplay = document.getElementById('admin-email-display');
const langToggle = document.getElementById('admin-lang-toggle');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Modals
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const deleteModal = document.getElementById('delete-modal');

// API Helper
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });
    
    if (res.status === 401) {
      logout();
      return null;
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    verifyToken();
  } else {
    showLogin();
  }
  setupEventListeners();
  updateLanguage();
});

// Auth Flow
async function verifyToken() {
  try {
    const data = await apiCall('/api/auth.php?action=verify');
    if (data && (data.valid || data.success) && data.admin) {
      if (adminEmailDisplay) {
        adminEmailDisplay.textContent = data.admin.email || (data.admin.username ? `${data.admin.username} (${data.admin.email})` : 'Admin');
      }
      showAdminApp();
      loadDashboardData();
    } else {
      logout();
    }
  } catch (error) {
    logout();
  }
}

function showLogin() {
  if (loginPage) loginPage.style.display = 'flex';
  if (adminApp) adminApp.style.display = 'none';
}

function showAdminApp() {
  if (loginPage) loginPage.style.display = 'none';
  if (adminApp) adminApp.style.display = 'flex';
}

function logout() {
  token = null;
  localStorage.removeItem('admin_token');
  showLogin();
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const btn = document.getElementById('login-btn');
    
    if (btn) btn.disabled = true;
    if (loginError) loginError.textContent = '';
    
    try {
      const res = await fetch('/api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (res.ok && data.token) {
        token = data.token;
        localStorage.setItem('admin_token', token);
        if (adminEmailDisplay) {
          adminEmailDisplay.textContent = (data.admin && data.admin.email) ? data.admin.email : email;
        }
        showAdminApp();
        loadDashboardData();
      } else {
        if (loginError) loginError.textContent = data.error || getTranslation('err_login');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (loginError) loginError.textContent = getTranslation('err_login');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// Navigation & Event Listeners
function setupEventListeners() {
  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.getAttribute('data-page');
      navigateToPage(pageId);
      closeSidebar();
    });
  });

  // Mobile sidebar
  if (menuToggle && sidebar && sidebarOverlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.add('show');
      sidebarOverlay.classList.add('show');
    });

    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Language toggle
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      document.documentElement.lang = currentLang;
      document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
      langToggle.textContent = currentLang === 'ar' ? 'English' : 'العربية';
      updateLanguage();
      
      if (document.getElementById('page-dashboard').classList.contains('active')) loadDashboardData();
      if (document.getElementById('page-products').classList.contains('active')) renderProducts();
      if (document.getElementById('page-orders').classList.contains('active')) renderOrders();
      if (document.getElementById('page-settings').classList.contains('active')) loadSettingsData();
    });
  }

  // Dashboard Stats Cards Clicks
  const cardTotalOrders = document.getElementById('card-total-orders');
  if (cardTotalOrders) {
    cardTotalOrders.addEventListener('click', () => {
      navigateToPage('orders');
      setOrderFilterStatus('');
    });
  }

  const cardNewOrders = document.getElementById('card-new-orders');
  if (cardNewOrders) {
    cardNewOrders.addEventListener('click', () => {
      navigateToPage('orders');
      setOrderFilterStatus('new');
    });
  }

  const cardTotalSales = document.getElementById('card-total-sales');
  if (cardTotalSales) {
    cardTotalSales.addEventListener('click', () => {
      navigateToPage('orders');
      setOrderFilterStatus('');
    });
  }

  const cardTotalProducts = document.getElementById('card-total-products');
  if (cardTotalProducts) {
    cardTotalProducts.addEventListener('click', () => {
      navigateToPage('products');
      setProductFilter('all');
    });
  }

  const cardOutOfStock = document.getElementById('card-out-of-stock');
  if (cardOutOfStock) {
    cardOutOfStock.addEventListener('click', () => {
      navigateToPage('products');
      setProductFilter('out-of-stock');
    });
  }

  // Products Page Filter Pills
  const filterAllBtn = document.getElementById('prod-filter-all');
  if (filterAllBtn) {
    filterAllBtn.addEventListener('click', () => setProductFilter('all'));
  }
  const filterOutBtn = document.getElementById('prod-filter-out');
  if (filterOutBtn) {
    filterOutBtn.addEventListener('click', () => setProductFilter('out-of-stock'));
  }

  // Product Modals
  const addProdBtn = document.getElementById('btn-add-product');
  if (addProdBtn) addProdBtn.addEventListener('click', () => openProductModal());
  
  const prodCloseBtn = document.getElementById('product-modal-close');
  if (prodCloseBtn) prodCloseBtn.addEventListener('click', () => closeProductModal());
  
  const prodCancelBtn = document.getElementById('product-modal-cancel');
  if (prodCancelBtn) prodCancelBtn.addEventListener('click', () => closeProductModal());
  
  const delCloseBtn = document.getElementById('delete-modal-close');
  if (delCloseBtn) delCloseBtn.addEventListener('click', () => closeDeleteModal());
  
  const delCancelBtn = document.getElementById('delete-modal-cancel');
  if (delCancelBtn) delCancelBtn.addEventListener('click', () => closeDeleteModal());
  
  const delConfirmBtn = document.getElementById('delete-btn-confirm');
  if (delConfirmBtn) delConfirmBtn.addEventListener('click', confirmDeleteProduct);

  // Product Form Submit
  if (productForm) {
    productForm.addEventListener('submit', handleProductSubmit);
  }
  
  // Image preview in product modal
  const imgInput = document.getElementById('product-image');
  if (imgInput) {
    imgInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      const preview = document.getElementById('image-preview');
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 140px; border-radius: 8px; margin-top: 8px; object-fit: contain;">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Order status filter tabs
  document.querySelectorAll('#orders-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#orders-filters .filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const status = e.target.getAttribute('data-status');
      loadOrdersData(status);
    });
  });

  // Settings Forms
  const settingsProfileForm = document.getElementById('settings-profile-form');
  if (settingsProfileForm) {
    settingsProfileForm.addEventListener('submit', handleProfileSettingsSubmit);
  }

  const settingsLogoForm = document.getElementById('settings-logo-form');
  if (settingsLogoForm) {
    settingsLogoForm.addEventListener('submit', handleLogoSettingsSubmit);
  }
}

function navigateToPage(pageId) {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.getAttribute('data-page') === pageId);
  });
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');
  
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = getTranslation(`nav_${pageId}`);
  }
  
  if (pageId === 'dashboard') loadDashboardData();
  if (pageId === 'products') loadProductsData();
  if (pageId === 'orders') loadOrdersData();
  if (pageId === 'settings') loadSettingsData();
}

function setOrderFilterStatus(status) {
  document.querySelectorAll('#orders-filters .filter-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-status') === status);
  });
  loadOrdersData(status);
}

function setProductFilter(filterType) {
  currentProductFilter = filterType;
  const filterAllBtn = document.getElementById('prod-filter-all');
  const filterOutBtn = document.getElementById('prod-filter-out');
  
  if (filterAllBtn) filterAllBtn.classList.toggle('active', filterType === 'all');
  if (filterOutBtn) filterOutBtn.classList.toggle('active', filterType === 'out-of-stock');
  
  renderProducts();
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove('show');
  if (sidebarOverlay) sidebarOverlay.classList.remove('show');
}

// Translations logic
function updateLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang] && i18n[currentLang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = i18n[currentLang][key];
      } else {
        el.textContent = i18n[currentLang][key];
      }
    }
  });
}

function getTranslation(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || key;
}

// Utilities
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatPrice(amount) {
  const num = parseFloat(amount) || 0;
  return `${num.toFixed(2)} ${getTranslation('currency')}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusLabel(status) {
  return getTranslation(`status_lbl_${status}`) || status;
}

// Dashboard
async function loadDashboardData() {
  try {
    const stats = await apiCall('/api/admin.php?action=stats');
    if (!stats) return;
    
    const statTotalOrders = document.getElementById('stat-total-orders');
    const statNewOrders = document.getElementById('stat-new-orders');
    const statTotalSales = document.getElementById('stat-total-sales');
    const statTotalProducts = document.getElementById('stat-total-products');
    const statOutOfStock = document.getElementById('stat-out-of-stock');
    
    if (statTotalOrders) statTotalOrders.textContent = stats.total_orders || 0;
    if (statNewOrders) statNewOrders.textContent = stats.new_orders || 0;
    if (statTotalSales) statTotalSales.textContent = formatPrice(stats.total_sales || 0);
    if (statTotalProducts) statTotalProducts.textContent = stats.total_products || 0;
    if (statOutOfStock) statOutOfStock.textContent = stats.out_of_stock || 0;
    
    // Update badge in sidebar
    const badge = document.getElementById('new-orders-badge');
    if (badge) {
      if (stats.new_orders > 0) {
        badge.textContent = stats.new_orders;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Load recent orders
    const ordersRes = await apiCall('/api/admin.php?action=orders');
    if (ordersRes && ordersRes.orders) {
      renderRecentOrders(ordersRes.orders.slice(0, 5));
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 1.5rem; color: var(--text-muted);">لا توجد طلبات / No orders</td></tr>`;
    return;
  }
  
  orders.forEach(order => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.title = 'انقر لعرض تفاصيل الطلب';
    tr.addEventListener('click', () => {
      navigateToPage('orders');
      setOrderFilterStatus('');
    });
    tr.innerHTML = `
      <td><strong>#${order.order_number}</strong></td>
      <td>${escapeHtml(order.customer_name)}</td>
      <td style="font-weight: 700; color: var(--primary);">${formatPrice(order.total)}</td>
      <td><span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span></td>
      <td style="color: var(--text-muted); font-size: 0.9rem;">${formatDate(order.created_at)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Products
async function loadProductsData() {
  try {
    const res = await apiCall('/api/admin.php?action=products');
    if (res) {
      productsList = Array.isArray(res) ? res : (res.products || []);
      renderProducts();
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showToast(getTranslation('err_fetch'), 'error');
  }
}

function renderProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  let list = productsList;
  if (currentProductFilter === 'out-of-stock') {
    list = productsList.filter(p => p.stock === 0 || !p.stock);
  }

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted)">لا توجد منتجات / No products found</td></tr>`;
    return;
  }
  
  list.forEach(p => {
    const isOutOfStock = p.stock === 0 || !p.stock;
    const stockDisplay = isOutOfStock
      ? `<span class="badge-stock-out">0 (نفد المخزون)</span>`
      : `<span style="font-weight: 700; color: var(--primary);">${p.stock}</span>`;
    
    const discountDisplay = (p.discount && p.discount > 0)
      ? `<span style="color: #16A34A; font-weight: 700;">-${formatPrice(p.discount)}</span>`
      : `<span style="color: var(--text-muted);">-</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="/uploads/${p.image}" class="product-thumbnail" onerror="this.src='/assets/logo.jpg'" alt="${escapeHtml(p.name)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);"></td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td><span class="badge" style="background: rgba(45,80,22,0.1); color: var(--primary);">${getTranslation(`cat_${p.category}`)}</span></td>
      <td style="font-weight: 700;">${formatPrice(p.price)}</td>
      <td>${discountDisplay}</td>
      <td>${stockDisplay}</td>
      <td>
        <div class="actions" style="display: flex; gap: 8px;">
          <button class="btn-icon btn-edit" onclick="editProduct(${p.id})" title="تعديل / Edit" style="background: var(--bg); border: 1px solid var(--border); padding: 6px; border-radius: 6px; cursor: pointer; color: var(--primary);">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon btn-delete" onclick="deleteProduct(${p.id})" title="حذف / Delete" style="background: #FEE2E2; border: 1px solid #FECACA; padding: 6px; border-radius: 6px; cursor: pointer; color: var(--danger);">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openProductModal(product = null) {
  const form = document.getElementById('product-form');
  const title = document.getElementById('product-modal-title');
  const imageRequiredStar = document.getElementById('image-required-star');
  const imageInput = document.getElementById('product-image');
  const preview = document.getElementById('image-preview');
  
  if (form) form.reset();
  if (preview) preview.innerHTML = '';
  
  if (product) {
    if (title) title.textContent = getTranslation('modal_edit_product');
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-desc').value = product.description || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-discount').value = (product.discount && product.discount > 0) ? product.discount : '';
    document.getElementById('product-category').value = product.category || 'hair';
    document.getElementById('product-stock').value = product.stock !== undefined ? product.stock : 20;
    
    if (product.image && preview) {
      preview.innerHTML = `<img src="/uploads/${product.image}" onerror="this.src='/assets/logo.jpg'" alt="Preview" style="max-width: 100%; max-height: 120px; border-radius: 8px; margin-top: 8px; object-fit: contain;">`;
    }
    
    if (imageRequiredStar) imageRequiredStar.style.display = 'none';
    if (imageInput) imageInput.required = false;
  } else {
    if (title) title.textContent = getTranslation('modal_add_product');
    document.getElementById('product-id').value = '';
    document.getElementById('product-stock').value = '20';
    if (imageRequiredStar) imageRequiredStar.style.display = 'inline';
    if (imageInput) imageInput.required = true;
  }
  
  if (productModal) productModal.classList.add('active');
}

function closeProductModal() {
  if (productModal) productModal.classList.remove('active');
}

window.editProduct = (id) => {
  const product = productsList.find(p => p.id === id);
  if (product) openProductModal(product);
};

async function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const price = document.getElementById('product-price').value;
  const category = document.getElementById('product-category').value;
  const stock = document.getElementById('product-stock').value;
  const description = document.getElementById('product-desc').value.trim();
  const discount = document.getElementById('product-discount').value;

  if (!name || price === '' || !category) {
    showToast(currentLang === 'ar' ? 'يرجى ملء الحقول المطلوبة (اسم المنتج، السعر، القسم)' : 'Please fill all required fields', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('discount', discount);
  formData.append('category', category);
  formData.append('stock', stock !== '' ? stock : 0);
  
  const imageFile = document.getElementById('product-image').files[0];
  if (imageFile) {
    formData.append('image', imageFile);
  } else if (!id) {
    showToast(currentLang === 'ar' ? 'يرجى اختيار صورة للمنتج' : 'Please upload a product image', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('product-btn-save');
  if (submitBtn) submitBtn.disabled = true;
  
  try {
    const isEdit = !!id;
    const url = isEdit
      ? `/api/admin.php?action=update_product&id=${id}`
      : '/api/admin.php?action=add_product';
    const method = isEdit ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (res.status === 401) {
      logout();
      return;
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save product');
    
    showToast(getTranslation(isEdit ? 'success_edit' : 'success_add'));
    closeProductModal();
    await loadProductsData();
    await loadDashboardData();
  } catch (error) {
    console.error('Save product error:', error);
    showToast(error.message, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

window.deleteProduct = (id) => {
  deleteId = id;
  if (deleteModal) deleteModal.classList.add('active');
};

function closeDeleteModal() {
  deleteId = null;
  if (deleteModal) deleteModal.classList.remove('active');
}

async function confirmDeleteProduct() {
  if (!deleteId) return;
  const btn = document.getElementById('delete-btn-confirm');
  if (btn) btn.disabled = true;
  
  try {
    await apiCall(`/api/admin.php?action=delete_product&id=${deleteId}`, { method: 'DELETE' });
    showToast(getTranslation('success_delete'));
    closeDeleteModal();
    await loadProductsData();
    await loadDashboardData();
  } catch (error) {
    console.error('Delete product error:', error);
    showToast(error.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Orders
async function loadOrdersData(status = '') {
  try {
    const res = await apiCall(`/api/admin.php?action=orders&status=${status}`);
    ordersList = (res && res.orders) ? res.orders : [];
    renderOrders();
  } catch (error) {
    console.error('Load orders error:', error);
    showToast(getTranslation('err_fetch'), 'error');
  }
}

function renderOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (!ordersList || ordersList.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 3rem; color: var(--text-muted); background: var(--surface); border-radius: var(--radius);">لا توجد طلبات في هذه الحالة / No orders found</div>`;
    return;
  }
  
  ordersList.forEach(order => {
    const isNew = order.status === 'new';
    
    const itemsHtml = (order.items || []).map(item => `
      <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border);">
        <span><strong>${escapeHtml(item.product_name)}</strong> × ${item.quantity}</span>
        <span style="color: var(--primary); font-weight: 700;">${formatPrice(item.subtotal || (item.price_at_purchase * item.quantity))}</span>
      </li>
    `).join('');
    
    const div = document.createElement('div');
    div.className = `order-card ${isNew ? 'is-new' : ''}`;
    div.innerHTML = `
      <div class="order-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border); margin-bottom: 16px;">
        <div class="order-title" style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.2rem; font-weight: 800; color: var(--primary);">#${order.order_number}</span>
          ${isNew ? '<span class="new-badge" style="background: #E0F2FE; color: #0369A1; font-weight: 800; padding: 4px 10px; border-radius: 999px; font-size: 0.82rem; border: 1px solid #BAE6FD;">🆕 طلب جديد</span>' : ''}
          <span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span>
        </div>
        <div class="order-meta" style="color: var(--text-muted); font-size: 0.88rem;">${formatDate(order.created_at)}</div>
      </div>
      
      <div class="order-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px;">
        <div class="customer-info" style="background: var(--bg); padding: 16px; border-radius: 8px;">
          <h4 style="color: var(--primary); margin-bottom: 8px; font-size: 1rem;">بيانات العميل / Customer</h4>
          <p style="margin-bottom: 4px;"><strong>الاسم:</strong> ${escapeHtml(order.customer_name)}</p>
          <p style="margin-bottom: 4px;"><strong>الهاتف:</strong> <span dir="ltr">${escapeHtml(order.phone)}</span></p>
          <p style="margin-bottom: 4px;"><strong>العنوان:</strong> ${escapeHtml(order.address)}</p>
          <p style="color: var(--accent); font-weight: 700; margin-top: 6px;">طريقة الدفع: الدفع عند الاستلام (Cash on Delivery)</p>
        </div>
        
        <div class="order-items" style="background: var(--bg); padding: 16px; border-radius: 8px;">
          <h4 style="color: var(--primary); margin-bottom: 8px; font-size: 1rem;">المنتجات المطلوبة / Items</h4>
          <ul class="order-items-list" style="margin-bottom: 12px;">
            ${itemsHtml}
          </ul>
          
          <div class="order-summary" style="padding-top: 8px; border-top: 1px solid var(--border);">
            <div class="summary-line" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.9rem;">
              <span>${getTranslation('subtotal')}</span>
              <span>${formatPrice(order.subtotal)}</span>
            </div>
            ${order.discount > 0 ? `
            <div class="summary-line text-danger" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.9rem; color: #16A34A; font-weight: 700;">
              <span>${getTranslation('discount')}</span>
              <span>-${formatPrice(order.discount)}</span>
            </div>` : ''}
            <div class="summary-line total" style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; color: var(--primary); padding-top: 6px; border-top: 1px dashed var(--border);">
              <span>${getTranslation('col_total')}</span>
              <span>${formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="order-actions" style="display: flex; align-items: center; gap: 12px; background: #FAF7F2; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border);">
        <label style="font-weight: 700; color: var(--primary); margin-bottom: 0;">تغيير حالة الطلب / Status:</label>
        <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)" style="width: auto; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--primary); background: #FFFFFF;">
          <option value="new" ${order.status === 'new' ? 'selected' : ''}>طلب جديد (New)</option>
          <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>تم التأكيد (Confirmed)</option>
          <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>جاري التجهيز (Preparing)</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن (Shipped)</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم (Delivered)</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي (Cancelled)</option>
        </select>
      </div>
    `;
    
    container.appendChild(div);
  });
}

window.updateOrderStatus = async (id, newStatus) => {
  try {
    await apiCall(`/api/admin.php?action=order_status&id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    
    showToast(getTranslation('success_status'));
    
    const activeBtn = document.querySelector('#orders-filters .filter-btn.active');
    const activeTab = activeBtn ? activeBtn.getAttribute('data-status') : '';
    await loadOrdersData(activeTab);
    await loadDashboardData();
  } catch (error) {
    console.error('Update status error:', error);
    showToast(error.message, 'error');
  }
};

// Settings Data & Actions
async function loadSettingsData() {
  try {
    const res = await apiCall('/api/admin.php?action=settings');
    if (res && res.admin) {
      const usernameInput = document.getElementById('settings-username');
      const emailInput = document.getElementById('settings-email');
      const logoPreview = document.getElementById('settings-logo-preview');
      
      if (usernameInput) usernameInput.value = res.admin.username || 'admin';
      if (emailInput) emailInput.value = res.admin.email || '';
      if (logoPreview) logoPreview.src = `/assets/logo.jpg?v=${Date.now()}`;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function handleProfileSettingsSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('settings-username').value.trim();
  const email = document.getElementById('settings-email').value.trim();
  const current_password = document.getElementById('settings-current-password').value;
  const new_password = document.getElementById('settings-new-password').value;
  const confirm_password = document.getElementById('settings-confirm-password').value;
  
  if (!current_password) {
    showToast(getTranslation('label_current_password'), 'error');
    return;
  }
  
  if (new_password && new_password !== confirm_password) {
    showToast(currentLang === 'ar' ? 'تأكيد كلمة المرور الجديدة غير متطابق' : 'Password confirmation does not match', 'error');
    return;
  }
  
  const btn = document.getElementById('btn-save-settings');
  if (btn) btn.disabled = true;
  
  try {
    const res = await apiCall('/api/admin.php?action=update_profile', {
      method: 'PUT',
      body: JSON.stringify({
        username,
        email,
        current_password,
        new_password,
        confirm_password
      })
    });
    
    if (res && res.success) {
      if (res.token) {
        token = res.token;
        localStorage.setItem('admin_token', token);
      }
      if (adminEmailDisplay) {
        adminEmailDisplay.textContent = res.admin.email;
      }
      
      // Clear password fields
      document.getElementById('settings-current-password').value = '';
      document.getElementById('settings-new-password').value = '';
      document.getElementById('settings-confirm-password').value = '';
      
      showToast(getTranslation('success_credentials'));
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleLogoSettingsSubmit(e) {
  e.preventDefault();
  const logoInput = document.getElementById('settings-logo-input');
  const file = logoInput ? logoInput.files[0] : null;
  
  if (!file) {
    showToast(currentLang === 'ar' ? 'يرجى اختيار ملف الشعار' : 'Please select a logo file', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('logo', file);
  
  const btn = document.getElementById('btn-save-logo');
  if (btn) btn.disabled = true;
  
  try {
    const res = await fetch('/api/admin.php?action=update_logo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update logo');
    
    showToast(getTranslation('success_logo'));
    logoInput.value = '';
    
    // Refresh all logo instances on page
    const freshSrc = `/assets/logo.jpg?v=${Date.now()}`;
    document.querySelectorAll('.logo-sync').forEach(img => {
      img.src = freshSrc;
    });
  } catch (error) {
    console.error('Update logo error:', error);
    showToast(error.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
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
