/**
 * Aplicación Principal - Catálogo Interactivo
 * Equilibrio Distribuciones
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // ESTADO DE LA APLICACIÓN
  // ==========================================
  const state = {
    category: 'all',
    search: '',
    sort: 'default',
    productQuantities: {}, // Cantidad seleccionada en la tarjeta antes de agregar
    currentOrderPayload: null,
    visibleCount: 48,
    pageSize: 48
  };

  // Inicializar cantidades por defecto en 1 para cada producto
  PRODUCTS.forEach(p => {
    state.productQuantities[p.id] = 1;
  });

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const dom = {
    // Catálogo
    productsGrid: document.getElementById('products-grid'),
    emptyState: document.getElementById('empty-state'),
    categoryPillsContainer: document.getElementById('category-pills-container'),
    categorySelect: document.getElementById('category-select'),
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    sortSelect: document.getElementById('sort-select'),
    resultsCount: document.getElementById('results-count'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    loadMoreContainer: document.getElementById('load-more-container'),
    btnLoadMore: document.getElementById('btn-load-more'),
    loadMoreText: document.getElementById('load-more-text'),

    // Navegación y Carrito
    cartBadgeNav: document.getElementById('cart-badge-nav'),
    cartTotalNav: document.getElementById('cart-total-nav'),
    floatingCartBtn: document.getElementById('floating-cart-btn'),
    cartBadgeFloat: document.getElementById('cart-badge-float'),
    cartTotalFloat: document.getElementById('cart-total-float'),
    btnNavbarCart: document.getElementById('btn-navbar-cart'),

    // Drawer Lateral
    cartBackdrop: document.getElementById('cart-backdrop'),
    cartPanel: document.getElementById('cart-panel'),
    btnCloseCart: document.getElementById('btn-close-cart'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    cartEmptyView: document.getElementById('cart-empty-view'),
    cartFooterView: document.getElementById('cart-footer-view'),
    drawerItemsCount: document.getElementById('drawer-items-count'),
    drawerSubtotal: document.getElementById('drawer-subtotal'),
    drawerTotal: document.getElementById('drawer-total'),
    btnCartBackToShop: document.getElementById('btn-cart-back-to-shop'),
    btnClearCart: document.getElementById('btn-clear-cart'),

    // Formulario de Checkout
    checkoutForm: document.getElementById('checkout-form'),
    custName: document.getElementById('cust-name'),
    custPhone: document.getElementById('cust-phone'),
    custAddress: document.getElementById('cust-address'),
    custPayment: document.getElementById('cust-payment'),
    custNotes: document.getElementById('cust-notes'),
    errCustName: document.getElementById('err-cust-name'),
    errCustPhone: document.getElementById('err-cust-phone'),
    errCustAddress: document.getElementById('err-cust-address'),
    btnSendWhatsapp: document.getElementById('btn-send-whatsapp'),
    btnSendWhatsApp: document.getElementById('btn-send-whatsapp'),
    textBtnSendWhatsapp: document.getElementById('text-btn-send-whatsapp'),
    btnTriggerWebhook: document.getElementById('btn-trigger-webhook'),

    // Modo Testeo
    boxTestMode: document.getElementById('box-test-mode'),
    checkTestMode: document.getElementById('check-test-mode'),
    badgeTestActive: document.getElementById('badge-test-active'),

    // Modal Webhook / Sheets
    modalWebhook: document.getElementById('modal-webhook'),
    btnCloseWebhookModal: document.getElementById('btn-close-webhook-modal'),
    btnDoneWebhook: document.getElementById('btn-done-webhook'),
    modalOrderTag: document.getElementById('modal-order-tag'),
    sheetsRowBody: document.getElementById('sheets-row-body'),
    emailSubjectPreview: document.getElementById('email-subject-preview'),
    emailBodyPreview: document.getElementById('email-body-preview'),
    jsonPreviewCode: document.getElementById('json-preview-code'),
    btnCopyJson: document.getElementById('btn-copy-json'),
    btnDownloadCsv: document.getElementById('btn-download-csv'),
    btnDownloadJson: document.getElementById('btn-download-json'),
    tabBtnSheets: document.getElementById('tab-btn-sheets'),
    tabBtnEmail: document.getElementById('tab-btn-email'),
    tabBtnJson: document.getElementById('tab-btn-json'),
    tabContentSheets: document.getElementById('tab-content-sheets'),
    tabContentEmail: document.getElementById('tab-content-email'),
    tabContentJson: document.getElementById('tab-content-json'),

    // Modal Configuración
    btnOpenSettings: document.getElementById('btn-open-settings'),
    modalSettings: document.getElementById('modal-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnCancelSettings: document.getElementById('btn-cancel-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    settingWhatsapp: document.getElementById('setting-whatsapp'),
    settingTestPhone: document.getElementById('setting-test-phone'),
    btnResetWhatsappOfficial: document.getElementById('btn-reset-whatsapp-official'),
    settingWebhook: document.getElementById('setting-webhook'),

    // Sincronización Google Drive
    btnSyncDrive: document.getElementById('btn-sync-drive'),
    iconSyncDrive: document.getElementById('icon-sync-drive'),
    textSyncDrive: document.getElementById('text-sync-drive'),
    heroProductsCount: document.getElementById('hero-products-count'),

    // Toasts y Footer
    toastContainer: document.getElementById('toast-container'),
    footerContactLink: document.getElementById('footer-contact-link'),

    // Modal Zoom de Producto
    modalZoomImage: document.getElementById('modal-zoom-image'),
    btnCloseZoom: document.getElementById('btn-close-zoom'),
    btnSecondaryCloseZoom: document.getElementById('btn-secondary-close-zoom'),
    zoomImgSrc: document.getElementById('zoom-img-src'),
    zoomBrand: document.getElementById('zoom-brand'),
    zoomPres: document.getElementById('zoom-pres'),
    zoomSintacc: document.getElementById('zoom-sintacc'),
    zoomTitle: document.getElementById('zoom-title'),
    zoomPrice: document.getElementById('zoom-price'),
    zoomBtnAdd: document.getElementById('zoom-btn-add')
  };

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  function init() {
    renderCategoryPills();
    renderProducts();
    updateCartUI(cart.getItems(), cart.getSummary());

    if (dom.heroProductsCount) {
      dom.heroProductsCount.textContent = `${PRODUCTS.length.toLocaleString('es-AR')} Productos Disponibles`;
    }

    // Cargar datos previos de cliente si existen
    loadCustomerDraft();

    // Sincronizar estado inicial del Modo Testeo
    syncTestModeUI();

    // Suscribirse a cambios en el carrito
    cart.subscribe((items, summary) => {
      updateCartUI(items, summary);
      renderProducts(false); // Preserva la cantidad visible al interactuar con el carrito
    });

    setupEventListeners();
    refreshIcons();
  }

  // ==========================================
  // RENDERIZADO DE CATEGORÍAS (PILLS)
  // ==========================================
  function calculateCategoryCounts() {
    const counts = { all: PRODUCTS.length, 'Sin TACC': 0 };
    
    PRODUCTS.forEach(p => {
      if (p.isSinTacc) counts['Sin TACC'] += 1;

      // Conteo por categoría
      if (!counts[p.categoria]) counts[p.categoria] = 0;
      counts[p.categoria] += 1;

      if (p.mainCategory !== p.categoria) {
        if (!counts[p.mainCategory]) counts[p.mainCategory] = 0;
        counts[p.mainCategory] += 1;
      }
    });

    return counts;
  }

  function renderCategoryPills() {
    const counts = calculateCategoryCounts();
    if (!dom.categoryPillsContainer) return;
    dom.categoryPillsContainer.innerHTML = '';

    // Sincronizar selector de categorías si existe en el DOM
    if (dom.categorySelect) {
      if (dom.categorySelect.options.length === 0) {
        CATEGORIES.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat.id;
          let count = 0;
          if (cat.id === 'all') count = counts.all;
          else if (cat.id === 'Sin TACC') count = counts['Sin TACC'];
          else count = counts[cat.id] || 0;
          opt.textContent = `${cat.label} (${count})`;
          dom.categorySelect.appendChild(opt);
        });
        dom.categorySelect.addEventListener('change', (e) => {
          state.category = e.target.value;
          renderCategoryPills();
          renderProducts();
        });
      }
      dom.categorySelect.value = state.category;
    }

    // Renderizar todas las píldoras de categoría desplegadas y visibles
    CATEGORIES.forEach(cat => {
      let count = 0;
      if (cat.id === 'all') count = counts.all;
      else if (cat.id === 'Sin TACC') count = counts['Sin TACC'];
      else count = counts[cat.id] || 0;

      const button = document.createElement('button');
      const isActive = state.category === cat.id;

      button.type = 'button';
      button.className = `cat-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all active:scale-95 ${
        isActive 
          ? 'active' 
          : cat.highlight 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`;

      button.dataset.catId = cat.id;
      button.innerHTML = `
        <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 ${cat.highlight && !isActive ? 'text-emerald-600' : ''}"></i>
        <span>${cat.label}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${
          isActive ? 'bg-brand-900/30 text-white' : 'bg-gray-100 text-gray-600'
        }">${count}</span>
      `;

      button.addEventListener('click', (e) => {
        e.preventDefault();
        state.category = cat.id;
        if (dom.categorySelect) dom.categorySelect.value = cat.id;
        renderCategoryPills();
        renderProducts();
      });

      dom.categoryPillsContainer.appendChild(button);
    });

    refreshIcons();
  }

  // ==========================================
  // NORMALIZACIÓN DE TEXTO (IGNORA ACENTOS / TILDES)
  // ==========================================
  function stripAccents(str) {
    return (str || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ==========================================
  // FILTRADO Y ORDENAMIENTO INTELIGENTE DE PRODUCTOS
  // ==========================================
  function getFilteredProducts() {
    let list = [...PRODUCTS];

    // 1. Filtro por Categoría
    if (state.category !== 'all') {
      if (state.category === 'Sin TACC') {
        list = list.filter(p => p.isSinTacc);
      } else {
        const catNorm = stripAccents(state.category);
        list = list.filter(p => 
          stripAccents(p.categoria).includes(catNorm) || 
          stripAccents(p.mainCategory).includes(catNorm)
        );
      }
    }

    // 2. Filtro Inteligente de Búsqueda de Texto con Relevancia y Normalización
    const cleanQ = stripAccents(state.search);
    const scored = [];

    if (cleanQ.length > 0) {
      const tokens = cleanQ.split(/\s+/).filter(Boolean);

      for (const p of list) {
        const normProd = stripAccents(p.producto);
        const normBrand = stripAccents(p.marca);
        const normCat = stripAccents(p.categoria);
        const normSearchStr = stripAccents(p.searchString);

        let allTokensMatch = true;
        let totalScore = 0;

        for (const t of tokens) {
          const isShort = t.length <= 2;
          const wordRegex = new RegExp(`\\b${t}\\b`, 'i');
          const startWordRegex = new RegExp(`\\b${t}`, 'i');

          const matchesWordTitle = wordRegex.test(normProd);
          const matchesStartWordTitle = startWordRegex.test(normProd);
          const matchesSubTitle = normProd.includes(t);
          const matchesSubSearchStr = normSearchStr.includes(t);

          // Si el término de búsqueda es corto (ej: "te", "té"), exigimos que sea inicio de palabra
          // para evitar que "te" coincida con sílabas internas de s-te-via, man-te-ca, cho-cola-te, fru-ti-lla
          if (isShort) {
            if (!startWordRegex.test(normSearchStr)) {
              allTokensMatch = false;
              break;
            }
          } else {
            if (!matchesSubSearchStr) {
              allTokensMatch = false;
              break;
            }
          }

          // Puntuación de relevancia:
          // Palabra exacta en el nombre del producto (ej: "Té") -> máxima relevancia
          if (matchesWordTitle) totalScore += 3000;
          else if (matchesStartWordTitle) totalScore += 1500;
          else if (matchesSubTitle) totalScore += 400;

          // Marca
          if (wordRegex.test(normBrand)) totalScore += 900;
          else if (startWordRegex.test(normBrand)) totalScore += 450;

          // Categoría
          if (wordRegex.test(normCat)) totalScore += 700;

          // Bonificación especial: búsqueda de "te" en categoría Infusiones o Hierbas
          if (t === 'te' && (p.categoria === 'Infusiones' || p.categoria === 'Hierbas Medicinales')) {
            totalScore += 2000;
          }
        }

        if (allTokensMatch) {
          scored.push({ product: p, score: totalScore });
        }
      }

      // Si el ordenamiento es Relevancia (por defecto), ordenamos por puntuación descendente
      if (state.sort === 'default') {
        scored.sort((a, b) => b.score - a.score || a.product.id - b.product.id);
        return scored.map(s => s.product);
      }
      list = scored.map(s => s.product);
    }

    // 3. Ordenamiento tradicional (cuando no es Relevancia o no hay búsqueda)
    switch (state.sort) {
      case 'price-asc':
        list.sort((a, b) => a.precio - b.precio);
        break;
      case 'price-desc':
        list.sort((a, b) => b.precio - a.precio);
        break;
      case 'name-asc':
        list.sort((a, b) => a.producto.localeCompare(b.producto));
        break;
      case 'default':
      default:
        // Mantener orden natural por ID
        list.sort((a, b) => a.id - b.id);
        break;
    }

    return list;
  }

  // ==========================================
  // RENDERIZADO DE TARJETAS DE PRODUCTO
  // ==========================================
  function renderProducts(resetCount = true) {
    if (resetCount) {
      state.visibleCount = state.pageSize;
    }

    const products = getFilteredProducts();

    // Actualizar conteo de resultados con detalle contextual
    updateResultsCount(products.length);

    if (products.length === 0) {
      dom.productsGrid.classList.add('hidden');
      dom.emptyState.classList.remove('hidden');
      if (dom.loadMoreContainer) dom.loadMoreContainer.classList.add('hidden');
      return;
    }

    dom.productsGrid.classList.remove('hidden');
    dom.emptyState.classList.add('hidden');
    dom.productsGrid.innerHTML = '';

    const visibleList = products.slice(0, state.visibleCount);
    visibleList.forEach(product => {
      const card = createProductCard(product);
      dom.productsGrid.appendChild(card);
    });

    if (dom.loadMoreContainer) {
      if (state.visibleCount < products.length) {
        dom.loadMoreContainer.classList.remove('hidden');
        const remaining = products.length - state.visibleCount;
        dom.loadMoreText.textContent = `Mostrar más productos (Viendo ${visibleList.length} de ${products.length} • Quedan ${remaining})`;
      } else {
        dom.loadMoreContainer.classList.add('hidden');
      }
    }

    refreshIcons();
  }

  function updateResultsCount(count) {
    if (!dom.resultsCount) return;
    const formattedCount = Number(count).toLocaleString('es-AR');
    const searchVal = state.search.trim();

    if (searchVal.length > 0) {
      dom.resultsCount.innerHTML = `
        <span class="text-brand-900 font-bold">${formattedCount}</span> 
        <span class="text-gray-500 font-medium">para</span> 
        <span class="text-brand-950 font-bold bg-brand-50 px-1.5 py-0.5 rounded-md border border-brand-200/60">"${escapeHtml(searchVal)}"</span>
      `;
    } else if (state.category !== 'all') {
      dom.resultsCount.innerHTML = `
        <span class="text-brand-900 font-bold">${formattedCount}</span> 
        <span class="text-gray-500 font-medium">en</span> 
        <span class="text-brand-900 font-bold">${escapeHtml(state.category)}</span>
      `;
    } else {
      dom.resultsCount.innerHTML = `
        <span class="text-brand-900 font-bold">${formattedCount}</span> 
        <span class="text-gray-500 font-medium">productos</span>
      `;
    }
  }

  function getCategoryTheme(cat, isSinTacc) {
    if (isSinTacc) {
      return {
        bg: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-green-100/60',
        border: 'border-emerald-200/70',
        badge: 'bg-white/95 border border-emerald-200/80 text-emerald-800 shadow-2xs',
        iconColor: 'text-emerald-700',
        brandColor: 'text-emerald-950'
      };
    }
    switch (cat) {
      case 'Sin TACC':
      case 'Panificados (Sin TACC)':
      case 'Almacén (Sin TACC)':
        return {
          bg: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-green-100/60',
          border: 'border-emerald-200/70',
          badge: 'bg-white/95 border border-emerald-200/80 text-emerald-800 shadow-2xs',
          iconColor: 'text-emerald-700',
          brandColor: 'text-emerald-950'
        };
      case 'Hierbas Medicinales':
      case 'Infusiones':
        return {
          bg: 'bg-gradient-to-br from-lime-50/90 via-emerald-50/40 to-stone-100/60',
          border: 'border-lime-200/70',
          badge: 'bg-white/95 border border-lime-200/80 text-lime-800 shadow-2xs',
          iconColor: 'text-lime-700',
          brandColor: 'text-brand-950'
        };
      case 'Aromas y Fragancias':
        return {
          bg: 'bg-gradient-to-br from-purple-50/80 via-fuchsia-50/30 to-stone-100/60',
          border: 'border-purple-200/70',
          badge: 'bg-white/95 border border-purple-200/80 text-purple-800 shadow-2xs',
          iconColor: 'text-purple-700',
          brandColor: 'text-purple-950'
        };
      case 'Cosmética Natural':
        return {
          bg: 'bg-gradient-to-br from-rose-50/80 via-pink-50/30 to-stone-100/60',
          border: 'border-rose-200/70',
          badge: 'bg-white/95 border border-rose-200/80 text-rose-800 shadow-2xs',
          iconColor: 'text-rose-700',
          brandColor: 'text-rose-950'
        };
      case 'Panificados y Galletitas':
        return {
          bg: 'bg-gradient-to-br from-amber-50/90 via-yellow-50/30 to-stone-100/60',
          border: 'border-amber-200/70',
          badge: 'bg-white/95 border border-amber-200/80 text-amber-800 shadow-2xs',
          iconColor: 'text-amber-700',
          brandColor: 'text-amber-950'
        };
      case 'Repostería':
        return {
          bg: 'bg-gradient-to-br from-orange-50/90 via-amber-50/30 to-stone-100/60',
          border: 'border-orange-200/70',
          badge: 'bg-white/95 border border-orange-200/80 text-orange-800 shadow-2xs',
          iconColor: 'text-orange-700',
          brandColor: 'text-orange-950'
        };
      case 'Condimentos':
        return {
          bg: 'bg-gradient-to-br from-red-50/80 via-amber-50/30 to-stone-100/60',
          border: 'border-red-200/70',
          badge: 'bg-white/95 border border-red-200/80 text-red-800 shadow-2xs',
          iconColor: 'text-red-700',
          brandColor: 'text-red-950'
        };
      case 'Almacén':
      default:
        return {
          bg: 'bg-gradient-to-br from-stone-50 via-brand-50/40 to-amber-50/40',
          border: 'border-brand-200/60',
          badge: 'bg-white/95 border border-brand-200/80 text-brand-800 shadow-2xs',
          iconColor: 'text-brand-700',
          brandColor: 'text-brand-950'
        };
    }
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-gray-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden group';

    const inCartQty = cart.getItemQuantity(product.id);
    const selectedQty = state.productQuantities[product.id] || 1;
    const theme = getCategoryTheme(product.categoria, product.isSinTacc);

    // Badges flotantes en la imagen
    const sinTaccBadge = product.isSinTacc 
      ? `<span class="badge-sin-tacc text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 shadow-2xs backdrop-blur-xs bg-emerald-50/95">
           <i data-lucide="wheat-off" class="w-2.5 h-2.5 sm:w-3 sm:h-3"></i> Sin TACC
         </span>` 
      : '';

    const inCartBadge = inCartQty > 0
      ? `<span class="bg-brand-900/90 text-white border border-brand-700 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 shadow-2xs backdrop-blur-xs">
           <i data-lucide="check" class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-200"></i> ${inCartQty} en pedido
         </span>`
      : '';

    // Contenedor visual armónico (media box)
    let mediaBoxHtml = '';
    if (product.imagen) {
      mediaBoxHtml = `
        <div class="product-media-container relative w-full rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3 bg-gradient-to-b from-stone-50 to-emerald-50/20 flex items-center justify-center border border-gray-100 group-hover:border-brand-200 transition-all cursor-pointer">
          <img 
            src="${product.imagen}" 
            alt="${escapeHtml(product.producto)}" 
            loading="lazy" 
            class="product-thumb-img w-full h-full object-contain p-1 sm:p-2 transition-transform duration-300 group-hover:scale-105"
            onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
          >
          <!-- Fallback en caso de error de carga -->
          <div class="hidden flex flex-col items-center justify-center text-center p-2 sm:p-3 w-full h-full ${theme.bg}">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${theme.badge} flex items-center justify-center mb-1">
              <i data-lucide="${product.icon}" class="w-5 h-5 sm:w-6 sm:h-6 ${theme.iconColor}"></i>
            </div>
            <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate max-w-full px-1">${escapeHtml(product.marca)}</span>
          </div>

          <!-- Badges flotantes en la imagen -->
          <div class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center gap-1 z-10 pointer-events-none">
            ${sinTaccBadge}
          </div>
          <div class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 z-10 pointer-events-none">
            ${inCartBadge}
          </div>

          <!-- Lupa para ampliar -->
          <button type="button" class="btn-card-zoom absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-brand-900 shadow-2xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90 cursor-pointer" title="Ver foto ampliada">
            <i data-lucide="zoom-in" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
          </button>
        </div>
      `;
    } else {
      mediaBoxHtml = `
        <div class="product-media-container relative w-full rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3 ${theme.bg} flex flex-col items-center justify-center text-center p-2 sm:p-4 border ${theme.border} group-hover:border-brand-200 transition-all">
          <!-- Badges flotantes -->
          <div class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center gap-1 z-10 pointer-events-none">
            ${sinTaccBadge}
          </div>
          <div class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 z-10 pointer-events-none">
            ${inCartBadge}
          </div>

          <!-- Círculo decorativo con icono de dietética natural -->
          <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${theme.badge} flex items-center justify-center mb-1 shadow-2xs transform group-hover:scale-105 transition-transform duration-300">
            <i data-lucide="${product.icon}" class="w-5 h-5 sm:w-7 sm:h-7 ${theme.iconColor}"></i>
          </div>
          <span class="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider sm:tracking-widest ${theme.brandColor} leading-tight line-clamp-1 max-w-[95%]">
            ${escapeHtml(product.marca)}
          </span>
          <span class="text-[8px] sm:text-[9px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5 truncate max-w-full">
            ${escapeHtml(product.categoria)}
          </span>
        </div>
      `;
    }

    card.innerHTML = `
      <!-- TOP: MEDIA + TÍTULO Y MARCA -->
      <div>
        ${mediaBoxHtml}

        <div class="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 font-medium mb-1 gap-1">
          <span class="text-brand-800 font-bold truncate max-w-[65%]">${escapeHtml(product.marca)}</span>
          <span class="bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold text-gray-600 shrink-0">${escapeHtml(product.presentacion)}</span>
        </div>

        <h3 class="font-bold text-gray-900 text-xs sm:text-base leading-tight sm:leading-snug line-clamp-2 min-h-[1.9rem] sm:min-h-[2.5rem] group-hover:text-brand-900 transition-colors" title="${escapeHtml(product.producto)}">
          ${escapeHtml(product.producto)}
        </h3>
      </div>

      <!-- BOTTOM: PRECIO Y ACCIONES -->
      <div class="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-gray-100 space-y-2 sm:space-y-2.5">
        
        <!-- PRECIO EN ARS -->
        <div class="flex items-baseline justify-between">
          <span class="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider">Precio Unit.</span>
          <span class="text-base sm:text-xl font-black text-brand-950">${formatPrice(product.precio)}</span>
        </div>

        <!-- SELECTOR DE CANTIDAD Y BOTÓN AGREGAR -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          
          <!-- SELECTOR DE CANTIDAD (+ / -) -->
          <div class="flex items-center border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50/80 p-0.5 shadow-2xs shrink-0">
            <button 
              type="button" 
              class="btn-qty-minus w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-brand-900 hover:bg-white rounded transition-colors active:scale-95 cursor-pointer"
              aria-label="Disminuir cantidad"
            >
              <i data-lucide="minus" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
            </button>
            <input 
              type="text" 
              inputmode="numeric" 
              value="${selectedQty}" 
              class="input-qty w-6 sm:w-8 text-center text-[11px] sm:text-xs font-bold bg-transparent text-gray-800 focus:outline-none"
              readonly
            >
            <button 
              type="button" 
              class="btn-qty-plus w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-brand-900 hover:bg-white rounded transition-colors active:scale-95 cursor-pointer"
              aria-label="Aumentar cantidad"
            >
              <i data-lucide="plus" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
            </button>
          </div>

          <!-- BOTÓN AGREGAR -->
          <button 
            type="button" 
            class="btn-add-to-cart flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-brand-800 hover:bg-brand-900 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-sm hover:shadow transition-all active:scale-98 cursor-pointer"
          >
            <i data-lucide="plus-circle" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"></i>
            <span class="truncate">Agregar</span>
          </button>

        </div>

      </div>
    `;

    // Eventos locales de la tarjeta
    const inputQty = card.querySelector('.input-qty');
    const btnMinus = card.querySelector('.btn-qty-minus');
    const btnPlus = card.querySelector('.btn-qty-plus');
    const btnAdd = card.querySelector('.btn-add-to-cart');
    const mediaContainer = card.querySelector('.product-media-container');
    const btnZoom = card.querySelector('.btn-card-zoom');

    if (product.imagen) {
      if (btnZoom) {
        btnZoom.addEventListener('click', (e) => {
          e.stopPropagation();
          openZoomModal(product);
        });
      }
      if (mediaContainer) {
        mediaContainer.addEventListener('click', () => {
          openZoomModal(product);
        });
      }
    }

    btnMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      let current = state.productQuantities[product.id] || 1;
      if (current > 1) {
        current -= 1;
        state.productQuantities[product.id] = current;
        inputQty.value = current;
      }
    });

    btnPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      let current = state.productQuantities[product.id] || 1;
      current += 1;
      state.productQuantities[product.id] = current;
      inputQty.value = current;
    });

    btnAdd.addEventListener('click', (e) => {
      e.stopPropagation();
      const qtyToAdd = state.productQuantities[product.id] || 1;
      cart.addItem(product, qtyToAdd);

      // Feedback visual
      triggerCartBump();
      showToast(`Se agregaron ${qtyToAdd}x "${product.producto}" al pedido`, 'success');

      // Restablecer cantidad en selector
      state.productQuantities[product.id] = 1;
      inputQty.value = 1;
    });

    return card;
  }

  // ==========================================
  // GESTIÓN Y RENDERIZADO DEL CARRITO (DRAWER)
  // ==========================================
  function updateCartUI(items, summary) {
    // Badges en Navbar y Botón Flotante
    const countFormatted = summary.totalUnits > 99 ? '99+' : summary.totalUnits;
    dom.cartBadgeNav.textContent = countFormatted;
    dom.cartBadgeFloat.textContent = countFormatted;

    const totalFormatted = formatPrice(summary.total);
    dom.cartTotalNav.textContent = totalFormatted;
    dom.cartTotalFloat.textContent = totalFormatted;

    // Header del Drawer
    dom.drawerItemsCount.textContent = `${summary.totalItems} producto${summary.totalItems !== 1 ? 's' : ''} (${summary.totalUnits} unidad${summary.totalUnits !== 1 ? 'es' : ''})`;
    dom.drawerSubtotal.textContent = totalFormatted;
    dom.drawerTotal.textContent = totalFormatted;

    // Vista vacía vs vista con items
    if (items.length === 0) {
      dom.cartItemsContainer.classList.add('hidden');
      dom.cartFooterView.classList.add('hidden');
      dom.cartEmptyView.classList.remove('hidden');
      return;
    }

    dom.cartItemsContainer.classList.remove('hidden');
    dom.cartFooterView.classList.remove('hidden');
    dom.cartEmptyView.classList.add('hidden');
    dom.cartItemsContainer.innerHTML = '';

    items.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 text-xs';

      const itemSubtotal = formatPrice(item.precio * item.cantidad);
      const sinTaccTag = item.isSinTacc ? '<span class="text-emerald-700 font-semibold">[Sin TACC]</span>' : '';

      itemRow.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="font-bold text-gray-800 truncate">${item.producto} ${sinTaccTag}</div>
          <div class="text-[11px] text-gray-500 mt-0.5 truncate">${item.marca} • ${item.presentacion}</div>
          <div class="text-[11px] text-brand-900 font-semibold mt-0.5">
            ${formatPrice(item.precio)} c/u ➔ <span class="font-bold">${itemSubtotal}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- STEPPER DE CANTIDAD -->
          <div class="flex items-center border border-gray-200 rounded-lg bg-white p-0.5">
            <button class="btn-cart-minus w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">
              <i data-lucide="minus" class="w-3 h-3"></i>
            </button>
            <span class="w-6 text-center font-bold text-xs text-gray-800">${item.cantidad}</span>
            <button class="btn-cart-plus w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">
              <i data-lucide="plus" class="w-3 h-3"></i>
            </button>
          </div>

          <!-- BOTÓN ELIMINAR -->
          <button class="btn-cart-remove p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar del pedido">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;

      // Eventos de stepper en carrito
      itemRow.querySelector('.btn-cart-minus').addEventListener('click', () => cart.decrement(item.id));
      itemRow.querySelector('.btn-cart-plus').addEventListener('click', () => cart.increment(item.id));
      itemRow.querySelector('.btn-cart-remove').addEventListener('click', () => cart.removeItem(item.id));

      dom.cartItemsContainer.appendChild(itemRow);
    });

    refreshIcons();
  }

  function openCart() {
    dom.cartBackdrop.classList.add('active');
    dom.cartPanel.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    dom.cartBackdrop.classList.remove('active');
    dom.cartPanel.classList.remove('active');
    document.body.style.overflow = '';
  }

  function triggerCartBump() {
    dom.floatingCartBtn.classList.remove('cart-bump');
    void dom.floatingCartBtn.offsetWidth; // Force reflow
    dom.floatingCartBtn.classList.add('cart-bump');

    dom.btnNavbarCart.classList.remove('cart-bump');
    void dom.btnNavbarCart.offsetWidth;
    dom.btnNavbarCart.classList.add('cart-bump');
  }

  // ==========================================
  // FORMULARIO Y VALIDACIONES DE CLIENTE
  // ==========================================
  function getCustomerFormData() {
    return {
      name: dom.custName.value.trim(),
      phone: dom.custPhone.value.trim(),
      address: dom.custAddress.value.trim(),
      paymentMethod: dom.custPayment.value,
      notes: dom.custNotes.value.trim()
    };
  }

  function saveCustomerDraft() {
    try {
      const data = getCustomerFormData();
      localStorage.setItem('equilibrio_customer_draft', JSON.stringify(data));
    } catch (e) {
      console.warn('Error guardando borrador:', e);
    }
  }

  function loadCustomerDraft() {
    try {
      const saved = localStorage.getItem('equilibrio_customer_draft');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.name) dom.custName.value = data.name;
        if (data.phone) dom.custPhone.value = data.phone;
        if (data.address) dom.custAddress.value = data.address;
        if (data.paymentMethod) dom.custPayment.value = data.paymentMethod;
        if (data.notes) dom.custNotes.value = data.notes;
      }
    } catch (e) {
      console.warn('Error cargando borrador:', e);
    }
  }

  function validateCustomerForm() {
    const customer = getCustomerFormData();
    const validation = CheckoutService.validateCustomerData(customer);

    // Reset error labels
    dom.errCustName.classList.add('hidden');
    dom.errCustPhone.classList.add('hidden');
    dom.errCustAddress.classList.add('hidden');
    dom.custName.classList.remove('border-red-500');
    dom.custPhone.classList.remove('border-red-500');
    dom.custAddress.classList.remove('border-red-500');

    if (!validation.isValid) {
      if (validation.errors.name) {
        dom.errCustName.textContent = validation.errors.name;
        dom.errCustName.classList.remove('hidden');
        dom.custName.classList.add('border-red-500');
      }
      if (validation.errors.phone) {
        dom.errCustPhone.textContent = validation.errors.phone;
        dom.errCustPhone.classList.remove('hidden');
        dom.custPhone.classList.add('border-red-500');
      }
      if (validation.errors.address) {
        dom.errCustAddress.textContent = validation.errors.address;
        dom.errCustAddress.classList.remove('hidden');
        dom.custAddress.classList.add('border-red-500');
      }
    }

    return validation;
  }

  // ==========================================
  // DESPACHO A WHATSAPP
  // ==========================================
  function handleSendWhatsApp() {
    const items = cart.getItems();
    if (items.length === 0) {
      showToast('Tu pedido está vacío. Agregá productos antes de despachar.', 'warning');
      return;
    }

    const validation = validateCustomerForm();
    if (!validation.isValid) {
      showToast('Por favor completá los datos obligatorios de entrega.', 'error');
      dom.custName.focus();
      return;
    }

    saveCustomerDraft();
    const customer = getCustomerFormData();
    const summary = cart.getSummary();
    const orderId = CheckoutService.generateOrderId();

    // Guardamos en historial local
    const orderPayload = CheckoutService.createOrderPayload(customer, items, summary, orderId);
    CheckoutService.saveOrderToHistory(orderPayload);

    // Abrimos enlace de WhatsApp en nueva pestaña
    const whatsappUrl = CheckoutService.getWhatsAppUrl(customer, items, summary, orderId);
    window.open(whatsappUrl, '_blank');

    const config = CheckoutService.getConfig();
    if (config.testMode) {
      showToast(`🧪 ¡Pedido de Prueba #${orderId} preparado! Redirigiendo a WhatsApp...`, 'warning');
    } else {
      showToast(`¡Pedido #${orderId} preparado! Redirigiendo a WhatsApp...`, 'success');
    }
  }

  // ==========================================
  // DISPARADOR / SIMULADOR DE WEBHOOK
  // ==========================================
  async function handleTriggerWebhook() {
    const items = cart.getItems();
    if (items.length === 0) {
      showToast('Agregá productos al pedido para registrar el webhook.', 'warning');
      return;
    }

    const validation = validateCustomerForm();
    if (!validation.isValid) {
      showToast('Completá los datos obligatorios de entrega primero.', 'error');
      dom.custName.focus();
      return;
    }

    saveCustomerDraft();
    const customer = getCustomerFormData();
    const summary = cart.getSummary();
    const orderId = CheckoutService.generateOrderId();
    const orderPayload = CheckoutService.createOrderPayload(customer, items, summary, orderId);
    state.currentOrderPayload = orderPayload;

    // Feedback de carga en el botón
    const originalText = dom.btnTriggerWebhook.innerHTML;
    dom.btnTriggerWebhook.disabled = true;
    dom.btnTriggerWebhook.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-brand-700"></i> Procesando persistencia...`;
    refreshIcons();

    try {
      const result = await CheckoutService.triggerWebhook(orderPayload);
      populateWebhookModal(orderPayload, result);
      openWebhookModal();
      showToast(`¡Pedido registrado exitosamente en Google Sheets y Webhook!`, 'success');
    } catch (err) {
      showToast(`Error registrando webhook: ${err.message}`, 'error');
    } finally {
      dom.btnTriggerWebhook.disabled = false;
      dom.btnTriggerWebhook.innerHTML = originalText;
      refreshIcons();
    }
  }

  function populateWebhookModal(payload, result) {
    dom.modalOrderTag.textContent = `Pedido #${payload.orderId} • ${payload.formattedDate}`;

    // 1. Google Sheets Row
    const itemsSummary = payload.items.map(i => `${i.cantidad}x ${i.producto} (${i.marca})`).join(', ');
    dom.sheetsRowBody.innerHTML = `
      <tr class="transition-colors">
        <td class="font-bold font-mono text-brand-900">${payload.orderId}</td>
        <td>${payload.formattedDate}</td>
        <td class="font-semibold text-gray-800">${payload.customer.name}</td>
        <td class="font-mono">${payload.customer.phone}</td>
        <td>${payload.customer.address}</td>
        <td class="max-w-xs truncate" title="${itemsSummary}">${itemsSummary}</td>
        <td class="font-extrabold text-emerald-700">${payload.summary.totalFormateado}</td>
        <td><span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">${payload.customer.paymentMethod}</span></td>
        <td><span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Registrado</span></td>
      </tr>
    `;

    // 2. Email Preview
    dom.emailSubjectPreview.textContent = `[Equilibrio Distribuciones] Nuevo Pedido #${payload.orderId} de ${payload.customer.name}`;
    dom.emailBodyPreview.innerHTML = `
      <div class="p-3 bg-brand-50 border border-brand-100 rounded-lg">
        <h4 class="font-bold text-brand-900 text-sm">Resumen para Armado y Logística</h4>
        <p class="text-gray-600 mt-1">El cliente <strong>${payload.customer.name}</strong> ha registrado una orden de compra.</p>
      </div>

      <div class="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-200">
        <div><strong>Teléfono:</strong> ${payload.customer.phone}</div>
        <div><strong>Forma de pago:</strong> ${payload.customer.paymentMethod}</div>
        <div class="col-span-2"><strong>Dirección:</strong> ${payload.customer.address}</div>
        ${payload.customer.notes ? `<div class="col-span-2 text-gray-500"><strong>Notas:</strong> ${payload.customer.notes}</div>` : ''}
      </div>

      <table class="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-100 text-gray-600 font-semibold">
          <tr>
            <th class="p-2">Ítem</th>
            <th class="p-2 text-center">Cant.</th>
            <th class="p-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          ${payload.items.map(i => `
            <tr>
              <td class="p-2">${i.producto} (${i.presentacion}) - <span class="text-gray-500">${i.marca}</span></td>
              <td class="p-2 text-center font-bold">${i.cantidad}</td>
              <td class="p-2 text-right font-semibold">${i.subtotalFormateado}</td>
            </tr>
          `).join('')}
          <tr class="bg-gray-50 font-bold">
            <td class="p-2 text-brand-950" colspan="2">TOTAL CONSOLIDADO:</td>
            <td class="p-2 text-right text-brand-800 text-sm">${payload.summary.totalFormateado}</td>
          </tr>
        </tbody>
      </table>
    `;

    // 3. JSON Payload
    dom.jsonPreviewCode.textContent = JSON.stringify(payload, null, 2);
  }

  function openWebhookModal() {
    dom.modalWebhook.classList.add('active');
  }

  function closeWebhookModal() {
    dom.modalWebhook.classList.remove('active');
  }

  // ==========================================
  // SINCRONIZACIÓN CON GOOGLE DRIVE
  // ==========================================
  async function handleSyncDrive() {
    if (window.location.protocol === 'file:') {
      showToast('Para sincronizar con Google Drive, abrí la app desde http://localhost:3000 o ejecutá "Actualizar Catálogo desde Drive.bat".', 'warning');
      return;
    }

    if (!dom.btnSyncDrive) return;

    const originalText = dom.textSyncDrive ? dom.textSyncDrive.textContent : 'Actualizar Drive';
    dom.btnSyncDrive.disabled = true;
    if (dom.iconSyncDrive) dom.iconSyncDrive.classList.add('animate-spin');
    if (dom.textSyncDrive) dom.textSyncDrive.textContent = 'Sincronizando...';

    showToast('Conectando con Google Drive y actualizando catálogo...', 'info');

    try {
      const response = await fetch('/api/sync-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const res = await response.json();

      if (res.success && Array.isArray(res.products)) {
        // Enriquecer y actualizar en memoria
        const enriched = window.enrichProducts ? window.enrichProducts(res.products) : res.products;
        PRODUCTS.length = 0;
        PRODUCTS.push(...enriched);

        // Inicializar cantidades de nuevos productos
        PRODUCTS.forEach(p => {
          if (!state.productQuantities[p.id]) {
            state.productQuantities[p.id] = 1;
          }
        });

        // Actualizar contador del Hero
        if (dom.heroProductsCount) {
          dom.heroProductsCount.textContent = `${res.total.toLocaleString('es-AR')} Productos Disponibles`;
        }

        // Re-renderizar categorías y productos
        renderCategoryPills();
        renderProducts(false);

        const msg = `🎉 ¡Catálogo actualizado desde Drive! ${res.total.toLocaleString('es-AR')} productos listos (${res.updatedPrices} precios actualizados, ${res.addedCount} nuevos).`;
        showToast(msg, 'success');
      } else {
        throw new Error(res.error || 'Respuesta no válida del proceso de sincronización');
      }
    } catch (err) {
      console.error('Error sincronizando con Drive:', err);
      showToast(`Error al sincronizar con Drive: ${err.message}`, 'error');
    } finally {
      dom.btnSyncDrive.disabled = false;
      if (dom.iconSyncDrive) dom.iconSyncDrive.classList.remove('animate-spin');
      if (dom.textSyncDrive) dom.textSyncDrive.textContent = originalText;
      refreshIcons();
    }
  }

  // ==========================================
  // MODAL ZOOM / VISTA PREVIA DE PRODUCTO
  // ==========================================
  let currentZoomProduct = null;

  function openZoomModal(product) {
    const modal = dom.modalZoomImage || document.getElementById('modal-zoom-image');
    if (!modal || !product || !product.imagen) return;
    currentZoomProduct = product;

    if (dom.zoomImgSrc) {
      dom.zoomImgSrc.src = product.imagen;
      dom.zoomImgSrc.alt = product.producto;
    }
    if (dom.zoomBrand) dom.zoomBrand.textContent = product.marca;
    if (dom.zoomPres) dom.zoomPres.textContent = product.presentacion;
    if (dom.zoomTitle) dom.zoomTitle.textContent = product.producto;
    if (dom.zoomPrice) dom.zoomPrice.textContent = formatPrice(product.precio);

    if (dom.zoomSintacc) {
      if (product.isSinTacc) {
        dom.zoomSintacc.classList.remove('hidden');
        dom.zoomSintacc.classList.add('flex');
      } else {
        dom.zoomSintacc.classList.add('hidden');
        dom.zoomSintacc.classList.remove('flex');
      }
    }

    modal.classList.add('active');
    refreshIcons();
  }

  function closeZoomModal() {
    const modal = dom.modalZoomImage || document.getElementById('modal-zoom-image');
    if (modal) {
      modal.classList.remove('active');
    }
    currentZoomProduct = null;
  }

  function addZoomProductToCart() {
    if (currentZoomProduct) {
      const prod = currentZoomProduct;
      cart.addItem(prod, 1);
      triggerCartBump();
      closeZoomModal();
      showToast(`¡1x "${prod.producto}" agregado al pedido!`, 'success');
    }
  }

  // Exponer a nivel global para llamadas directas y eventos
  window.openZoomModal = openZoomModal;
  window.closeZoomModal = closeZoomModal;
  window.addZoomProductToCart = addZoomProductToCart;

  // ==========================================
  // CONFIGURACIÓN DE WHATSAPP Y WEBHOOK
  // ==========================================
  function openSettingsModal() {
    const config = CheckoutService.getConfig();
    if (dom.settingWhatsapp) dom.settingWhatsapp.value = config.whatsappPhone || '';
    if (dom.settingTestPhone) dom.settingTestPhone.value = config.testWhatsappPhone || '';
    if (dom.settingWebhook) dom.settingWebhook.value = config.webhookUrl || '';
    if (dom.modalSettings) dom.modalSettings.classList.add('active');
  }

  function closeSettingsModal() {
    if (dom.modalSettings) dom.modalSettings.classList.remove('active');
  }

  function saveSettings() {
    const phone = dom.settingWhatsapp ? dom.settingWhatsapp.value.trim() : '';
    const testPhone = dom.settingTestPhone ? dom.settingTestPhone.value.trim() : '';
    const webhook = dom.settingWebhook ? dom.settingWebhook.value.trim() : '';

    CheckoutService.saveConfig({
      whatsappPhone: phone || CheckoutService.defaultPhone,
      testWhatsappPhone: testPhone,
      webhookUrl: webhook
    });

    closeSettingsModal();
    showToast('Configuración guardada exitosamente.', 'success');
  }

  function syncTestModeUI() {
    const config = CheckoutService.getConfig();
    const isTest = !!config.testMode;
    if (dom.checkTestMode) dom.checkTestMode.checked = isTest;
    if (dom.badgeTestActive) dom.badgeTestActive.classList.toggle('hidden', !isTest);
    if (dom.boxTestMode) {
      if (isTest) {
        dom.boxTestMode.classList.remove('border-amber-300', 'bg-amber-50/90');
        dom.boxTestMode.classList.add('border-amber-400', 'bg-amber-100/90', 'ring-2', 'ring-amber-300/50');
      } else {
        dom.boxTestMode.classList.remove('border-amber-400', 'bg-amber-100/90', 'ring-2', 'ring-amber-300/50');
        dom.boxTestMode.classList.add('border-amber-300', 'bg-amber-50/90');
      }
    }
    if (dom.textBtnSendWhatsapp) {
      dom.textBtnSendWhatsapp.textContent = isTest 
        ? 'Enviar Pedido de Prueba por WhatsApp' 
        : 'Enviar Pedido por WhatsApp';
    }
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-brand-900 text-white border-brand-700',
      error: 'bg-red-800 text-white border-red-700',
      warning: 'bg-amber-600 text-white border-amber-500',
      info: 'bg-gray-900 text-white border-gray-700'
    };

    const icons = {
      success: 'check-circle-2',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    toast.className = `toast-message px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 shrink-0"></i>
        <span>${message}</span>
      </div>
      <button class="text-white/70 hover:text-white shrink-0">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    toast.querySelector('button').addEventListener('click', () => {
      toast.remove();
    });

    dom.toastContainer.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3800);
  }

  // ==========================================
  // EVENT LISTENERS GENERALES
  // ==========================================
  function setupEventListeners() {
    // Buscador con debounce simple
    let searchTimeout;
    dom.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const val = e.target.value;
      dom.btnClearSearch.classList.toggle('hidden', val.length === 0);

      searchTimeout = setTimeout(() => {
        state.search = val;
        renderProducts();
      }, 180);
    });

    dom.btnClearSearch.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.btnClearSearch.classList.add('hidden');
      state.search = '';
      renderProducts();
      dom.searchInput.focus();
    });

    // Ordenamiento
    dom.sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderProducts();
    });

    // Restablecer filtros
    dom.btnResetFilters.addEventListener('click', () => {
      state.category = 'all';
      state.search = '';
      state.sort = 'default';
      dom.searchInput.value = '';
      dom.sortSelect.value = 'default';
      dom.btnClearSearch.classList.add('hidden');
      renderCategoryPills();
      renderProducts();
    });

    // Cargar más productos (Paginación / Scroll Progresivo)
    if (dom.btnLoadMore) {
      dom.btnLoadMore.addEventListener('click', () => {
        state.visibleCount += state.pageSize;
        renderProducts(false);
      });
    }

    // Abrir/Cerrar Carrito
    if (dom.floatingCartBtn) dom.floatingCartBtn.addEventListener('click', openCart);
    if (dom.btnNavbarCart) dom.btnNavbarCart.addEventListener('click', openCart);
    if (dom.btnCloseCart) dom.btnCloseCart.addEventListener('click', closeCart);
    if (dom.btnCartBackToShop) dom.btnCartBackToShop.addEventListener('click', closeCart);

    if (dom.cartBackdrop) {
      dom.cartBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.cartBackdrop) closeCart();
      });
    }

    // Vaciar Carrito
    if (dom.btnClearCart) {
      dom.btnClearCart.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas vaciar todos los productos del pedido?')) {
          cart.clearCart();
          showToast('El pedido ha sido vaciado.', 'info');
        }
      });
    }

    // Guardar cambios en vivo en los campos de cliente
    [dom.custName, dom.custPhone, dom.custAddress, dom.custPayment, dom.custNotes].forEach(input => {
      if (input) input.addEventListener('input', saveCustomerDraft);
    });

    // Despacho
    const btnWhatsApp = dom.btnSendWhatsApp || dom.btnSendWhatsapp;
    if (btnWhatsApp) btnWhatsApp.addEventListener('click', handleSendWhatsApp);
    if (dom.btnTriggerWebhook) dom.btnTriggerWebhook.addEventListener('click', handleTriggerWebhook);

    // Modal Webhook
    if (dom.btnCloseWebhookModal) dom.btnCloseWebhookModal.addEventListener('click', closeWebhookModal);
    if (dom.btnDoneWebhook) dom.btnDoneWebhook.addEventListener('click', closeWebhookModal);
    if (dom.modalWebhook) {
      dom.modalWebhook.addEventListener('click', (e) => {
        if (e.target === dom.modalWebhook) closeWebhookModal();
      });
    }

    // Tabs del Modal Webhook
    if (dom.tabBtnSheets) dom.tabBtnSheets.addEventListener('click', () => switchWebhookTab('sheets'));
    if (dom.tabBtnEmail) dom.tabBtnEmail.addEventListener('click', () => switchWebhookTab('email'));
    if (dom.tabBtnJson) dom.tabBtnJson.addEventListener('click', () => switchWebhookTab('json'));

    // Descargas y Copiado
    if (dom.btnCopyJson) {
      dom.btnCopyJson.addEventListener('click', () => {
        if (state.currentOrderPayload) {
          navigator.clipboard.writeText(JSON.stringify(state.currentOrderPayload, null, 2));
          showToast('Payload JSON copiado al portapapeles', 'success');
        }
      });
    }

    if (dom.btnDownloadCsv) {
      dom.btnDownloadCsv.addEventListener('click', () => {
        if (state.currentOrderPayload) {
          CheckoutService.exportToCSV(state.currentOrderPayload);
          showToast('Descargando archivo CSV...', 'info');
        }
      });
    }

    if (dom.btnDownloadJson) {
      dom.btnDownloadJson.addEventListener('click', () => {
        if (state.currentOrderPayload) {
          CheckoutService.exportToJSON(state.currentOrderPayload);
          showToast('Descargando archivo JSON...', 'info');
        }
      });
    }

    // Sincronización Google Drive
    if (dom.btnSyncDrive) {
      dom.btnSyncDrive.addEventListener('click', handleSyncDrive);
    }

    // Modal Configuración
    if (dom.btnOpenSettings) dom.btnOpenSettings.addEventListener('click', openSettingsModal);
    if (dom.btnCloseSettings) dom.btnCloseSettings.addEventListener('click', closeSettingsModal);
    if (dom.btnCancelSettings) dom.btnCancelSettings.addEventListener('click', closeSettingsModal);
    if (dom.btnSaveSettings) dom.btnSaveSettings.addEventListener('click', saveSettings);
    if (dom.btnResetWhatsappOfficial) {
      dom.btnResetWhatsappOfficial.addEventListener('click', () => {
        if (dom.settingWhatsapp) {
          dom.settingWhatsapp.value = CheckoutService.defaultPhone;
          showToast('Número restablecido al oficial de Equilibrio (5493416945514)', 'info');
        }
      });
    }
    if (dom.modalSettings) {
      dom.modalSettings.addEventListener('click', (e) => {
        if (e.target === dom.modalSettings) closeSettingsModal();
      });
    }

    // Modo Testeo Switch
    if (dom.checkTestMode) {
      dom.checkTestMode.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        CheckoutService.saveConfig({ testMode: isChecked });
        syncTestModeUI();
        if (isChecked) {
          showToast('Modo Testeo activado: Los pedidos saldrán con etiqueta [TEST]', 'warning');
        } else {
          showToast('Modo Normal activado: Pedidos listos para despacho oficial', 'info');
        }
      });
    }

    // Modal Zoom de Producto
    if (dom.btnCloseZoom) {
      dom.btnCloseZoom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeZoomModal();
      });
    }
    if (dom.btnSecondaryCloseZoom) {
      dom.btnSecondaryCloseZoom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeZoomModal();
      });
    }
    if (dom.modalZoomImage) {
      dom.modalZoomImage.addEventListener('click', (e) => {
        if (e.target === dom.modalZoomImage || e.target.classList.contains('modal-overlay')) {
          closeZoomModal();
        }
      });
      const zoomBox = dom.modalZoomImage.querySelector('.modal-box');
      if (zoomBox) {
        zoomBox.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    }
    if (dom.zoomBtnAdd) {
      dom.zoomBtnAdd.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addZoomProductToCart();
      });
    }

    // Contacto en Footer
    if (dom.footerContactLink) {
      dom.footerContactLink.addEventListener('click', () => {
        const config = CheckoutService.getConfig();
        const phone = config.whatsappPhone || CheckoutService.defaultPhone;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=Hola!%20Me%20contacto%20desde%20la%20webapp%20de%20Equilibrio%20Distribuciones.`, '_blank');
      });
    }

    // Tecla Escape para cerrar modales o drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCart();
        closeWebhookModal();
        closeSettingsModal();
        closeZoomModal();
      }
    });
  }

  function switchWebhookTab(activeTab) {
    const tabs = ['sheets', 'email', 'json'];
    tabs.forEach(t => {
      const btn = dom[`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`];
      const content = dom[`tabContent${t.charAt(0).toUpperCase() + t.slice(1)}`];

      if (t === activeTab) {
        btn.className = 'px-3 py-2 text-brand-900 border-b-2 border-brand-800 flex items-center gap-1.5 font-bold';
        content.classList.remove('hidden');
      } else {
        btn.className = 'px-3 py-2 text-gray-500 hover:text-gray-800 border-b-2 border-transparent flex items-center gap-1.5';
        content.classList.add('hidden');
      }
    });
  }

  // ==========================================
  // UTILIDADES
  // ==========================================
  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Lanzar app
  init();
});
