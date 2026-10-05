/**
 * Módulo de Despacho, WhatsApp y Webhook para Google Sheets / Email
 * Equilibrio Distribuciones
 */

const CheckoutService = {
  defaultPhone: '5493416945514', // Número oficial de Equilibrio Distribuciones: (341) 6945514
  storageConfigKey: 'equilibrio_config_v1',
  ordersHistoryKey: 'equilibrio_orders_history_v1',

  getConfig() {
    try {
      const stored = localStorage.getItem(this.storageConfigKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          whatsappPhone: parsed.whatsappPhone || this.defaultPhone,
          webhookUrl: parsed.webhookUrl || '',
          testMode: !!parsed.testMode,
          testWhatsappPhone: parsed.testWhatsappPhone || '',
          storeName: parsed.storeName || 'Equilibrio Distribuciones',
          storeEmail: parsed.storeEmail || 'pedidos@equilibriodistribuciones.com'
        };
      }
    } catch (e) {
      console.error('Error cargando configuración:', e);
    }
    return {
      whatsappPhone: this.defaultPhone,
      webhookUrl: '',
      testMode: false,
      testWhatsappPhone: '',
      storeName: 'Equilibrio Distribuciones',
      storeEmail: 'pedidos@equilibriodistribuciones.com'
    };
  },

  saveConfig(newConfig) {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(this.storageConfigKey, JSON.stringify(updated));
    return updated;
  },

  validateCustomerData(customer) {
    const errors = {};
    if (!customer.name || customer.name.trim().length < 3) {
      errors.name = 'Ingresá tu nombre y apellido (mínimo 3 letras).';
    }
    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      errors.phone = 'Ingresá un teléfono válido (mínimo 8 dígitos).';
    }
    if (!customer.address || customer.address.trim().length < 5) {
      errors.address = 'Ingresá tu dirección de entrega (calle, altura y localidad).';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  generateOrderId() {
    const now = new Date();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `EQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${random}`;
  },

  buildWhatsAppMessage(customer, items, summary, orderId, isTest = false) {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = '';
    if (isTest) {
      message += `🧪 *[PEDIDO DE PRUEBA - MODO TEST]* 🧪\n`;
      message += `⚠️ _Atención: Este mensaje es una simulación para probar el sistema de pedidos de Equilibrio Distribuciones._\n\n`;
    }

    message += `🌿 *NUEVO PEDIDO - EQUILIBRIO DISTRIBUCIONES* 🌿\n`;
    message += `📋 *Pedido:* #${orderId}\n`;
    message += `📅 *Fecha:* ${formattedDate}\n`;
    message += `────────────────────────────\n`;
    message += `👤 *Cliente:* ${customer.name.trim()}\n`;
    message += `📱 *Teléfono:* ${customer.phone.trim()}\n`;
    message += `📍 *Dirección de entrega:* ${customer.address.trim()}\n`;
    if (customer.paymentMethod) {
      message += `💳 *Forma de pago:* ${customer.paymentMethod}\n`;
    }
    if (customer.notes && customer.notes.trim()) {
      message += `📝 *Observaciones:* ${customer.notes.trim()}\n`;
    }
    message += `────────────────────────────\n`;
    message += `🛒 *DETALLE DEL PEDIDO:*\n\n`;

    items.forEach((item, index) => {
      const itemSubtotal = typeof formatPrice === 'function' ? formatPrice(item.precio * item.cantidad) : `$${(item.precio * item.cantidad).toLocaleString('es-AR')}`;
      const unitPrice = typeof formatPrice === 'function' ? formatPrice(item.precio) : `$${item.precio.toLocaleString('es-AR')}`;
      const tagTacc = item.isSinTacc ? ' [Sin TACC]' : '';
      message += `${index + 1}. *${item.producto}*${tagTacc}\n`;
      message += `   • Marca: ${item.marca} | ${item.presentacion}\n`;
      message += `   • Cantidad: ${item.cantidad} un. x ${unitPrice} = *${itemSubtotal}*\n\n`;
    });

    message += `────────────────────────────\n`;
    message += `📦 *Total de artículos:* ${summary.totalItems} ítems (${summary.totalUnits} unidades)\n`;
    const totalFormatted = typeof formatPrice === 'function' ? formatPrice(summary.total) : `$${summary.total.toLocaleString('es-AR')}`;
    message += `💰 *TOTAL A ABONAR:* *${totalFormatted}*\n`;
    message += `────────────────────────────\n`;
    if (isTest) {
      message += `🧪 _Pedido generado en Modo Testeo - No preparar ni despachar mercancía._\n`;
    } else {
      message += `✨ _Generado desde el Catálogo Interactivo de Equilibrio Distribuciones_ ✨\n`;
      message += `Agradecemos confirmar disponibilidad y fecha de entrega. ¡Muchas gracias!`;
    }

    return message;
  },

  getWhatsAppUrl(customer, items, summary, orderId) {
    const config = this.getConfig();
    const isTest = !!config.testMode;
    const message = this.buildWhatsAppMessage(customer, items, summary, orderId, isTest);
    const targetPhone = (isTest && config.testWhatsappPhone)
      ? config.testWhatsappPhone
      : (config.whatsappPhone || this.defaultPhone);
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  },

  createOrderPayload(customer, items, summary, orderId) {
    const config = this.getConfig();
    const now = new Date();
    return {
      orderId: orderId || this.generateOrderId(),
      isTest: !!config.testMode,
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        paymentMethod: customer.paymentMethod || 'A convenir',
        notes: (customer.notes || '').trim()
      },
      items: items.map(item => ({
        id: item.id,
        producto: item.producto,
        marca: item.marca,
        presentacion: item.presentacion,
        categoria: item.categoria,
        isSinTacc: item.isSinTacc,
        precioUnitario: item.precio,
        precioUnitarioFormateado: formatPrice(item.precio),
        cantidad: item.cantidad,
        subtotal: item.precio * item.cantidad,
        subtotalFormateado: formatPrice(item.precio * item.cantidad)
      })),
      summary: {
        totalVariedades: summary.totalItems,
        totalUnidades: summary.totalUnits,
        totalMonto: summary.total,
        totalFormateado: formatPrice(summary.total)
      },
      status: 'Recibido / En proceso de armado',
      channel: 'Catálogo Web Interactivo'
    };
  },

  saveOrderToHistory(orderPayload) {
    try {
      const history = JSON.parse(localStorage.getItem(this.ordersHistoryKey) || '[]');
      history.unshift(orderPayload);
      // Mantener últimos 50 pedidos
      if (history.length > 50) history.pop();
      localStorage.setItem(this.ordersHistoryKey, JSON.stringify(history));
    } catch (e) {
      console.error('Error guardando en historial local:', e);
    }
  },

  async triggerWebhook(orderPayload) {
    const config = this.getConfig();
    const hasCustomWebhook = !!(config.webhookUrl && config.webhookUrl.startsWith('http'));

    this.saveOrderToHistory(orderPayload);

    if (hasCustomWebhook) {
      try {
        const response = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        return {
          mode: 'real',
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          orderPayload
        };
      } catch (err) {
        console.warn('Fallo webhook real, activando simulación visual:', err);
        return {
          mode: 'real_error',
          error: err.message,
          orderPayload
        };
      }
    }

    // Simulación realista con 650ms de latencia
    await new Promise(resolve => setTimeout(resolve, 650));
    return {
      mode: 'simulation',
      success: true,
      orderPayload
    };
  },

  exportToCSV(orderPayload) {
    const rows = [
      ['ID Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Dirección', 'Producto', 'Marca', 'Presentación', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Total Pedido', 'Pago', 'Notas']
    ];

    orderPayload.items.forEach(item => {
      rows.push([
        orderPayload.orderId,
        orderPayload.formattedDate,
        `"${orderPayload.customer.name}"`,
        `"${orderPayload.customer.phone}"`,
        `"${orderPayload.customer.address}"`,
        `"${item.producto}"`,
        `"${item.marca}"`,
        `"${item.presentacion}"`,
        item.cantidad,
        item.precioUnitario,
        item.subtotal,
        orderPayload.summary.totalMonto,
        `"${orderPayload.customer.paymentMethod}"`,
        `"${orderPayload.customer.notes}"`
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pedido_${orderPayload.orderId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToJSON(orderPayload) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orderPayload, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Pedido_${orderPayload.orderId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
