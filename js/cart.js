/**
 * Gestión del Carrito de Compras
 * Equilibrio Distribuciones
 */

class CartManager {
  constructor() {
    this.storageKey = 'equilibrio_cart_v1';
    this.listeners = [];
    this.items = this.loadCart();
  }

  loadCart() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error cargando carrito de localStorage:', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error guardando carrito en localStorage:', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.getItems(), this.getSummary());
    }
  }

  getItems() {
    return [...this.items];
  }

  getItem(id) {
    return this.items.find(item => item.id === id) || null;
  }

  getItemQuantity(id) {
    const item = this.getItem(id);
    return item ? item.cantidad : 0;
  }

  addItem(product, quantity = 1) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const existingIndex = this.items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      this.items[existingIndex].cantidad += qty;
    } else {
      this.items.push({
        id: product.id,
        producto: product.producto,
        marca: product.marca,
        presentacion: product.presentacion,
        precio: product.precio,
        categoria: product.categoria,
        isSinTacc: product.isSinTacc,
        cantidad: qty
      });
    }

    this.saveCart();
    return this.getItemQuantity(product.id);
  }

  updateQuantity(id, newQty) {
    const qty = parseInt(newQty, 10);
    const index = this.items.findIndex(item => item.id === id);

    if (index > -1) {
      if (isNaN(qty) || qty <= 0) {
        this.items.splice(index, 1);
      } else {
        this.items[index].cantidad = qty;
      }
      this.saveCart();
    }
  }

  increment(id) {
    const item = this.getItem(id);
    if (item) {
      this.updateQuantity(id, item.cantidad + 1);
    }
  }

  decrement(id) {
    const item = this.getItem(id);
    if (item) {
      this.updateQuantity(id, item.cantidad - 1);
    }
  }

  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveCart();
  }

  clearCart() {
    this.items = [];
    this.saveCart();
  }

  getSummary() {
    let totalItems = 0;
    let totalUnits = 0;
    let subtotal = 0;

    for (const item of this.items) {
      totalItems += 1;
      totalUnits += item.cantidad;
      subtotal += item.precio * item.cantidad;
    }

    return {
      totalItems,
      totalUnits,
      subtotal,
      total: subtotal
    };
  }
}

// Instancia global del carrito
const cart = new CartManager();
