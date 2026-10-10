const translations = {
  ar: {
    welcome_msg: 'أهلاً بيك في Manar Store 🌿',
    nav_home: 'الرئيسية',
    nav_all: 'الكل',
    nav_products: 'جميع المنتجات',
    nav_hair: 'الشعر',
    nav_skin: 'البشرة',
    nav_body: 'الجسم',
    cat_all: 'الكل',
    cat_hair: 'الشعر',
    cat_skin: 'البشرة',
    cat_body: 'الجسم',
    hero_title: 'جمالك الطبيعي يبدأ من هنا',
    hero_subtitle: 'منتجات طبيعية أصيلة للشعر والبشرة والجسم',
    hero_cta: 'تسوقي الآن',
    add_to_cart: 'أضف للسلة',
    out_of_stock: 'غير متوفر',
    in_stock: 'متوفر',
    products_title: 'منتجاتنا',
    no_products: 'لا توجد منتجات في هذه الفئة',
    quantity: 'الكمية',
    description: 'الوصف',
    price: 'السعر',
    original_price: 'السعر الأصلي',
    discounted_price: 'السعر بعد الخصم',
    close: 'إغلاق',
    cart_title: 'سلة التسوق',
    cart_empty: 'سلتك فارغة',
    cart_empty_sub: 'أضف بعض المنتجات للبدء',
    remove: 'حذف',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    total: 'الإجمالي',
    checkout: 'إتمام الشراء',
    continue_shopping: 'متابعة التسوق',
    checkout_title: 'إتمام الطلب',
    order_summary: 'ملخص الطلب',
    customer_name: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    address: 'العنوان الكامل',
    payment_method: 'طريقة الدفع',
    cash_on_delivery: 'الدفع عند الاستلام',
    place_order: 'تأكيد الطلب',
    back_to_cart: 'العودة للسلة',
    name_required: 'الاسم مطلوب',
    phone_required: 'رقم الهاتف مطلوب',
    address_required: 'العنوان مطلوب',
    order_confirmed_title: 'تم استلام طلبك!',
    order_confirmed_msg: 'تم استلام طلبك بنجاح، وسنتواصل معك قريبًا لتأكيد الطلب.',
    order_number: 'رقم الطلب',
    continue_shopping_btn: 'متابعة التسوق',
    footer_desc: 'منتجات طبيعية أصيلة للعناية بالشعر والبشرة والجسم',
    footer_categories: 'الفئات',
    footer_contact: 'تواصل معنا',
    footer_whatsapp: 'واتساب',
    footer_rights: 'جميع الحقوق محفوظة',
    currency: 'ج',
    loading: 'جاري التحميل...',
    error_loading: 'حدث خطأ في تحميل المنتجات',
    retry: 'إعادة المحاولة',
    whatsapp_tooltip: 'تواصل معنا على واتساب'
  },
  en: {
    welcome_msg: 'Welcome to Manar Store 🌿',
    nav_home: 'Home',
    nav_all: 'All',
    nav_products: 'All Products',
    nav_hair: 'Hair',
    nav_skin: 'Skin',
    nav_body: 'Body',
    cat_all: 'All',
    cat_hair: 'Hair',
    cat_skin: 'Skin',
    cat_body: 'Body',
    hero_title: 'Your Natural Beauty Starts Here',
    hero_subtitle: 'Authentic natural products for hair, skin, and body',
    hero_cta: 'Shop Now',
    add_to_cart: 'Add to Cart',
    out_of_stock: 'Out of Stock',
    in_stock: 'In Stock',
    products_title: 'Our Products',
    no_products: 'No products in this category',
    quantity: 'Quantity',
    description: 'Description',
    price: 'Price',
    original_price: 'Original Price',
    discounted_price: 'Discounted Price',
    close: 'Close',
    cart_title: 'Shopping Cart',
    cart_empty: 'Your cart is empty',
    cart_empty_sub: 'Add some products to get started',
    remove: 'Remove',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    checkout: 'Checkout',
    continue_shopping: 'Continue Shopping',
    checkout_title: 'Checkout',
    order_summary: 'Order Summary',
    customer_name: 'Full Name',
    phone: 'Phone Number',
    address: 'Full Address',
    payment_method: 'Payment Method',
    cash_on_delivery: 'Cash on Delivery',
    place_order: 'Place Order',
    back_to_cart: 'Back to Cart',
    name_required: 'Name is required',
    phone_required: 'Phone number is required',
    address_required: 'Address is required',
    order_confirmed_title: 'Order Received!',
    order_confirmed_msg: 'Your order has been received successfully. We will contact you soon to confirm your order.',
    order_number: 'Order Number',
    continue_shopping_btn: 'Continue Shopping',
    footer_desc: 'Authentic natural products for hair, skin, and body care',
    footer_categories: 'Categories',
    footer_contact: 'Contact Us',
    footer_whatsapp: 'WhatsApp',
    footer_rights: 'All Rights Reserved',
    currency: 'EGP',
    loading: 'Loading...',
    error_loading: 'Error loading products',
    retry: 'Retry',
    whatsapp_tooltip: 'Contact us on WhatsApp'
  }
};

let currentLang = 'ar';

function t(key) {
  return translations[currentLang][key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('manar_lang', lang);
  updateAllTranslations();
}

function updateAllTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const attrs = el.getAttribute('data-i18n-attr').split(',');
    attrs.forEach(attrDef => {
      const [attr, key] = attrDef.split(':');
      if (attr && key) {
        el.setAttribute(attr.trim(), t(key.trim()));
      }
    });
  });
}

function initLanguage() {
  const saved = localStorage.getItem('manar_lang') || 'ar';
  setLanguage(saved);
}

// Init immediately for first render
initLanguage();
