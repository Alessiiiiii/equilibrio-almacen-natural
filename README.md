# 🌿 Equilibrio Distribuciones — Catálogo Web Interactivo

Webapp y Catálogo Interactivo diseñado para **Equilibrio Distribuciones (Almacén Natural)**. Permite a los clientes explorar productos, filtrar por categorías y Sin TACC, armar pedidos mayoristas o minoristas y despacharlos en un clic directamente a WhatsApp o sincronizarlos con Google Sheets / Email mediante Webhook.

---

## ✨ Características Principales

1. **Estética Saludable & Responsive**:
   - Diseño moderno con paleta orgánica (verdes bosque, salvia, crema y acentos en ámbar).
   - Optimizado para pantallas móviles y computadoras de escritorio.

2. **Filtros y Búsqueda en Tiempo Real**:
   - **Buscador Reactivo**: Búsqueda instantánea por nombre de producto, marca o presentación (ej: "miel", "cumaná", "1 kg", "sin tacc").
   - **Catálogo Completo Oficial (1.603 Productos)**:
     - *Todas* (1.603 productos)
     - *Almacén* (933 productos)
     - *🌾 Sin TACC* (+350 productos libres de gluten identificados)
     - *Condimentos* (56 productos)
     - *Aromas y Fragancias* (44 productos)
     - *Cosmética Natural* (124 productos)
     - *Hierbas Medicinales* (91 productos)
     - *Infusiones* (172 productos)
     - *Panificados y Galletitas* (119 productos)
     - *Repostería* (64 productos)
   - **Ordenamiento**: Por relevancia, menor precio, mayor precio y alfabético (A-Z).
   - **Paginación / Carga Progresiva Fluida**: Renderiza en lotes de 48 productos para garantizar carga instantánea en menos de 5ms y navegación ultra fluida en móviles.

3. **Tarjetas de Producto**:
   - Detalle de Marca, Nombre, Presentación y Categoría.
   - Precios en Pesos Argentinos (ARS) formateados con separadores de miles y decimales (`$ 5.200,00`).
   - Badges visuales temáticos y distintivo especial para productos **Sin TACC**.
   - Selector de cantidad (`-` / `+`) y botón de agregado con confirmación visual.
   - Indicador de cuántas unidades de ese producto ya están en el pedido.

4. **Carrito Flotante & Drawer Lateral**:
   - Botón flotante accesible en mobile y desktop con contador de unidades y total actualizado en vivo.
   - Panel deslizable (Drawer) con:
     - Lista de ítems con botones para sumar, restar o eliminar productos.
     - Subtotal por ítem y total general consolidado.
     - Botón para vaciar carrito con confirmación.
     - **Formulario Obligatorio de Datos del Cliente**: Nombre y Apellido, Teléfono / WhatsApp y Dirección de Entrega (con validaciones visuales).
     - Selección de Medio de Pago y campo para notas/horarios.

5. **Acciones de Despacho**:
   - **Enviar Pedido por WhatsApp**:
     - Valida los campos obligatorios del cliente.
     - Construye un mensaje estructurado con emojis de almacén natural, detalle de cada ítem, subtotales, total y datos de entrega.
     - Genera y abre el enlace `https://wa.me/{numero}?text={mensaje}` codificado.
   - **Simulador / Integración Webhook (Google Sheets & Email)**:
     - Envía los datos del pedido en formato JSON a un webhook real (Google Apps Script, Make, Zapier, n8n) o ejecuta la simulación interactiva.
     - Modal interactivo con 3 vistas:
       1. **Fila en Google Sheets**: Muestra exactamente cómo queda insertada la fila en la hoja de cálculo.
       2. **Notificación Email**: Vista previa del comprobante recibido por ventas y administración.
       3. **Payload JSON**: Estructura cruda con opción de copiado en un clic.
     - Botones para descargar directamente el pedido en formato **CSV (Excel)** o **JSON**.

6. **Panel de Configuración**:
   - Permite personalizar el número de WhatsApp receptor de la distribuidora y la URL del webhook directamente desde la aplicación sin tocar código.

---

## 🚀 Cómo Ejecutar Localmente

### Opción 1: Con Node.js (Servidor Nativo sin dependencias)
```bash
node server.js
```
O con npm:
```bash
npm start
```
Luego abre tu navegador en:
👉 **`http://localhost:3000`**

### Opción 2: Abrir directamente el archivo
Simplemente haz doble clic sobre `index.html` en el explorador de archivos de Windows o ejecútalo con cualquier servidor estático (como Live Server en VS Code o `python -m http.server 8000`).

---

## 📂 Estructura del Proyecto

```text
├── index.html            # Estructura de la aplicación web
├── css/
│   └── styles.css        # Sistema de diseño, animaciones y tema dietética
├── js/
│   ├── data.js           # Catálogo oficial de 40 productos y helpers de categoría
│   ├── cart.js           # Lógica reactiva del carrito y persistencia (localStorage)
│   ├── checkout.js       # Generador de WhatsApp, validaciones y simulador de webhook
│   └── app.js            # Controladores de UI, filtros, búsqueda y eventos
├── data/
│   └── products.json     # Copia cruda del dataset de productos en formato JSON
├── server.js             # Servidor HTTP nativo en Node.js
├── package.json          # Metadatos y scripts
└── README.md             # Documentación del proyecto
```
