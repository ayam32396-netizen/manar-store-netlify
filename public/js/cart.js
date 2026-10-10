class Cart {
  constructor() {
    this.STORAGE_KEY = 'manar_cart';
    this.items = this.load();
    this.onUpdate = null;
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch { return []; }
  }

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
    this.updateUI();
  }

  addItem(product, quantity = 1) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        discount: product.discount,
        final_price: product.final_price,
        image: product.image,
        stock: product.stock,
        quantity
      });
    }
    this.save();
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(i => i.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = Math.min(quantity, item.stock || 999);
        this.save();
      }
    }
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotalDiscount() {
    return this.items.reduce((sum, item) => {
      const disc = item.discount || 0;
      return sum + (disc * item.quantity);
    }, 0);
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.final_price * item.quantity), 0);
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.save();
  }

  updateUI() {
    const count = this.getCount();
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (this.onUpdate) {
      this.onUpdate();
    }
  }
}

const cart = new Cart();
