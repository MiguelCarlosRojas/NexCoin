# 🪙 NexCoin — Ecosistema de Comercio Descentralizado On-Chain

NexCoin es una plataforma de comercio electrónico descentralizado (Web3 Marketplace) que permite la compra y venta de productos tecnológicos y hardware cripto con liquidación directa entre compradores y proveedores, sin intermediarios bancarios ni custodios centralizados.

---

## 🚀 Arquitectura Tecnológica

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Web3 & WalletConnect:** `@reown/appkit` y `@reown/appkit-adapter-wagmi` (Reown AppKit v1.8+) sobre redes Ethereum, Polygon, Arbitrum, Base, Optimism, Sepolia y Bitcoin.
- **Base de Datos en Tiempo Real:** Supabase (PostgreSQL) con tablas relacionales (`products`, `suppliers`, `orders`, `order_items`).
- **Identidad Generativa:** Generador de avatares geométricos reactivos con `@blobatar/react` y `blobatar/expression`.
- **Generación de Comprobantes:** `jspdf` para vouchers y reportes oficiales en PDF; `xlsx` para reportes contables en Excel.

---

## 🛒 1. Flujo de Compra para el Cliente (Paso a Paso)

### Paso 1: Explorar el Catálogo
1. Ingresa a la tienda principal (`/`).
2. Utiliza la barra de búsqueda y los filtros avanzados:
   - **Categorías:** Billeteras Frías, Minería ASIC, Seguridad & Seed, Merchandising & Arte, Hardware & Nodos, Accesorios Cripto.
   - **Rango de Precios:** Filtrado por presupuesto en dólares USD o satoshis BTC.
   - **Descuentos:** Filtrar productos con ofertas activas.
   - **Modalidad de Envío:** Envío Gratis y Entrega Express 24h.
   - **Arrastrar Producto (Drag & Drop):** Al arrastrar cualquier producto hacia una nueva pestaña o ventana, se transfiere limpiamente el título del producto y su enlace directo sin texto residual.

### Paso 2: Ficha Detallada del Producto
1. Al hacer clic en un producto se genera su URL única (`/producto/:id`).
2. Podrás visualizar:
   - Galería de imágenes en alta resolución con carrusel interactivo y zoom.
   - Especificaciones técnicas, stock disponible y tiempo de entrega.
   - Información y reputación del proveedor verificado con su avatar Blobatar animado.
   - Opciones para compartir el producto en WhatsApp, Facebook, X (Twitter), Telegram, Correo o Copiar Enlace.
   - Sección interactiva de Preguntas & Respuestas y Opiniones verificadas.
   - Módulos de productos recomendados ("Quienes vieron este producto también compraron").

### Paso 3: Agregar al Carrito Flotante
1. Pulsa **"Agregar al carrito"** o **"Comprar ahora"**.
2. El **Carrito de Compras Flotante** se ubica en el lateral derecho de la pantalla, permitiendo consultar en cualquier momento la cantidad de artículos, el subtotal en USD y el total equivalente en Bitcoin (calculado en tiempo real según el precio spot).

### Paso 4: Conectar Billetera con WalletConnect (Reown AppKit)
1. Dentro del carrito, pulsa en el botón **"Conectar Wallet (Reown AppKit)"**.
2. Se desplegará el modal oficial de Reown AppKit / WalletConnect:
   - **Opción Móvil:** Escanea el código QR desde tu billetera favorita (MetaMask, Trust Wallet, Phantom, Rainbow, Coinbase Wallet, etc.).
   - **Opción Extensión de Navegador:** Conecta en 1 clic Rabby, MetaMask o cualquier billetera inyectada en tu navegador.
3. Tu dirección pública aparecerá vinculada de forma segura.

### Paso 5: Pago y Liquidación
1. Pulsa **"Autorizar Pago y Emitir Voucher"**.
2. El comprador firma la autorización de pago criptográfica.
3. Los fondos se transfieren de manera directa a la billetera de cobro principal del proveedor sin custodia central.

### Paso 6: Comprobante Criptográfico Oficial (Voucher)
1. Se genera inmediatamente el comprobante de compra con:
   - Código único de voucher inmutable (ej. `VOUCH-172767-9481`).
   - Hash de la transacción verificable en el explorador blockchain.
   - Dirección de la wallet que emitió el pago y billetera que recibió los fondos.
   - Desglose de productos, cantidades, precios unitarios y total liquidado en USD y BTC.
   - Código QR criptográfico para verificación de autenticidad.
2. Opciones de descarga:
   - **Descargar Voucher Oficial en PDF** con diseño timbrado.
   - **Exportar en Excel (.xlsx)** para control contable del comprador.
   - Copiar número de orden y hash de transacción.

---

## 🏢 2. Flujo del Proveedor / Vendedor (Paso a Paso)

### Paso 1: Registro e Inicio de Sesión
1. Dirígete al portal de proveedores (`/proveedores/login`).
2. Inicia sesión con tus credenciales o registra tu empresa indicando:
   - Nombre de la empresa o marca.
   - Nombre de contacto, teléfono y correo electrónico.
   - Conexión de tu billetera Web3 mediante WalletConnect / Reown AppKit para asignarla como billetera de cobro.

### Paso 2: Personalizador de Identidad Web3 con Blobatar Pro
En la sección **"Mi Perfil & Icono"** (`/proveedores/perfil`):
1. **Semilla Base Generativa:** Escribe el nombre de tu marca o pulsa **"Aleatorio"** para generar una identidad única mediante algoritmos de hashing visual.
2. **Expresión Facial (10 variantes):**
   - 😄 Feliz / Radiante
   - 😍 Enamorado / Fan
   - 😉 Pícaro / Guiño
   - 🤔 Analítico / Trader
   - 😏 Seguro / Triunfante
   - 😲 Sorprendido / Bullish
   - 😊 Modesto / Reservado
   - 😤 Decidido / Feroz
   - 😴 Relajado / Zen
   - 😐 Clásico / Neutral
3. **Silueta y Geometría del Marco:**
   - Círculo Perfecto (`rounded-full`)
   - Squircle Moderno (`rounded-3xl`)
   - Cuadrado Suave (`rounded-2xl`)
   - Compacto (`rounded-xl`)
4. **Tono de Acento & Brillo Neón (Glow):**
   - 🟡 Bitcoin Amber
   - 🟢 Web3 Emerald
   - 🔵 Ethereum Blue
   - 🟣 Solana Purple
   - 🔷 Cyber Cyan
   - ⚪ Minimalista
5. **Comportamiento de Animación:**
   - Interactivo al pasar el cursor (Hover)
   - Movimiento orgánico constante (Always)
   - Fijo sin movimiento (Static)
6. **Previsualización en Tiempo Real:** Visualiza tu identidad en 4 escalas reales antes de guardar (Barra lateral 48px, Ficha de producto 40px, Voucher 32px, Catálogo 24px).
7. Al guardar, el icono se propaga automáticamente a todos los productos del proveedor en la tienda.

### Paso 3: Gestión de Múltiples Billeteras de Cobro (Multi-Wallet P2P)
1. Conecta billeteras adicionales en 1 clic utilizando el botón integrado de Reown AppKit / WalletConnect.
2. O agrega manualmente direcciones seleccionando la red (`Ethereum / EVM`, `Polygon`, `Arbitrum`, `Base`, `Optimism`, `Bitcoin Native`, `BNB Chain`).
3. Marca en cualquier momento cuál de tus billeteras es la **"Principal para Cobro"** mediante el selector radial. Los fondos de las compras se liquidarán automáticamente a la billetera seleccionada.

### Paso 4: Publicación y Administración de Productos
En la sección **"Mis Productos"** (`/proveedores/productos`):
1. Pulsa **"Publicar Nuevo Producto"** para abrir el modal sincronizado con Supabase:
   - **Nombre y Descripción:** Título comercial y detalles técnicos.
   - **Categoría:** Billeteras Frías, Minería ASIC, Seguridad & Seed, Merchandising & Arte, Hardware & Nodos, Accesorios Cripto.
   - **Precio USD:** Cálculo automático del equivalente en Bitcoin al tipo de cambio spot.
   - **Inventario / Stock:** Cantidad física disponible.
   - **Código SKU:** Identificador único de inventario.
   - **Descuentos & Precio Original:** Porcentaje de descuento y precio tachado visible en la tienda.
   - **Modalidad de Envío:** Gratuito o Entrega Express 24h.
   - **Galería Multimedia:** URL de la foto principal y lista de URLs de imágenes adicionales para el carrusel de la página de detalle.
   - **Estado:** Activo (visible en tienda), Borrador o Archivado.
2. Edición rápida de stock inline directamente desde la tabla.
3. Desactivación o reactivación en 1 clic.

### Paso 5: Consultar Ventas y Emitir Vouchers
En **"Ventas & Vouchers"** (`/proveedores/ventas`):
- Listado de pedidos liquidados en tiempo real.
- Búsqueda por número de orden, código de voucher, cliente o hash de pago.
- Apertura del comprobante oficial con opción de reimpresión o descarga en PDF.

### Paso 6: Reportes Analíticos Oficiales
- **Reporte de Ventas (`/proveedores/reportes/ventas`):** Métricas de facturación bruta en USD y BTC, unidades vendidas, ticket promedio y exportación a Excel (.xlsx) y PDF.
- **Reporte de Inventario (`/proveedores/reportes/inventario`):** Monitoreo de stock crítico, artículos agotados, valorización total de almacén y exportación a Excel y PDF con formato corporativo.
- **Reporte de Clientes (`/proveedores/reportes/clientes`):** Listado de compradores con su dirección de wallet, pedidos acumulados y volumen total comprado, exportable a Excel.

---

## 💻 3. Instalación y Configuración Local

### Requisitos Previos
- Node.js 18.0 o superior
- Gestor de paquetes npm o pnpm

### Configuración del Entorno
Crea un archivo `.env` en la raíz del proyecto con tus credenciales:

```env
# Conexión con Supabase (Base de datos PostgreSQL)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# ID de Proyecto de Reown AppKit / WalletConnect Cloud (https://cloud.reown.com)
VITE_REOWN_PROJECT_ID=tu-project-id-de-reown
```

### Ejecutar el Proyecto

```bash
# Instalar dependencias optimizadas
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Compilar para producción (TypeScript + Vite)
npm run build

# Previsualizar el build de producción
npm run preview
```

---

## 🔒 4. Privacidad y Seguridad Non-Custodial

- **Sin custodia de fondos:** NexCoin no almacena claves privadas ni retiene fondos de usuarios. Las transacciones son P2P y directas a las billeteras de los proveedores.
- **Transparencia on-chain:** Cada orden genera un registro inmutable con comprobante criptográfico verificable.
- **Cumplimiento legal y protección:** Dispone de Libro de Reclamaciones digital, Términos y Condiciones y Políticas de Privacidad transparentes.
