-- ==============================================================================
-- NOVASATS MARKETPLACE: ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE
-- PORTAL DE PROVEEDORES & GESTIÓN PRINCIPAL (100% RELACIONAL & SIN LOCAL STORAGE)
-- ==============================================================================
-- Este script crea todas las tablas, subtablas, claves foráneas, índices y
-- políticas de seguridad RLS necesarias para el funcionamiento íntegro de:
-- 1. Mis Productos
-- 2. Preguntas de Clientes (Q&A)
-- 3. Calificaciones & Reseñas
-- 4. Ventas & Vouchers
-- 5. Mi Perfil & Icono (KYC Fiscal, Datos Comerciales, Billeteras, Vouchers, Seguridad)
-- ==============================================================================

-- 1. TABLA PRINCIPAL: PROVEEDORES (suppliers)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    wallet_address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBTABLA: BILLETERAS DE COBRO / RECAUDACIÓN (supplier_wallets)
CREATE TABLE IF NOT EXISTS public.supplier_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT 'Billetera de Cobro',
    network TEXT NOT NULL DEFAULT 'Ethereum / EVM',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supplier_wallets_supp ON public.supplier_wallets(supplier_id);

-- 3. TABLA: REGISTRO DE INFORMACIÓN FISCAL Y CUMPLIMIENTO (KYC PROVEEDORES) (supplier_kyc_fiscal)
CREATE TABLE IF NOT EXISTS public.supplier_kyc_fiscal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL UNIQUE REFERENCES public.suppliers(id) ON DELETE CASCADE,
    legal_name TEXT NOT NULL, -- Razón Social / Nombre Legal Registrado
    tax_id TEXT NOT NULL, -- RUC / Tax ID / NIF
    country TEXT NOT NULL DEFAULT 'Perú', -- País o Jurisdicción Legal
    business_address TEXT NOT NULL, -- Domicilio Fiscal Registrado
    legal_representative_name TEXT, -- Representante Legal Registrado
    legal_representative_id_doc TEXT, -- Documento de Identidad del Representante
    tax_resolution TEXT, -- Resolución / Autorización SUNAT
    official_receipt_type TEXT, -- Tipo de Comprobante Oficial (Factura / Boleta / On-Chain)
    fiscal_email TEXT, -- Correo Fiscal / Facturación
    fiscal_phone TEXT, -- Teléfono Fiscal Oficial
    is_verified BOOLEAN NOT NULL DEFAULT false, -- Estado de Verificación Oficial
    verified_at TIMESTAMPTZ,
    verification_hash TEXT, -- Hash Criptográfico On-Chain
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supplier_kyc_supp ON public.supplier_kyc_fiscal(supplier_id);

-- 4. TABLA: DATOS COMERCIALES DE LA EMPRESA / MARCA (supplier_commercial_profiles)
CREATE TABLE IF NOT EXISTS public.supplier_commercial_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL UNIQUE REFERENCES public.suppliers(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL, -- Nombre Comercial de la Marca / Tienda
    commercial_activity TEXT, -- Giro Comercial / Actividad Económica
    website_url TEXT, -- Sitio Web Oficial o Tienda Online
    support_email TEXT, -- Correo de Soporte al Cliente
    customer_phone TEXT, -- Teléfono Comercial
    whatsapp_number TEXT, -- WhatsApp de Contacto Directo
    commercial_address TEXT, -- Dirección Comercial / Tienda o Almacén
    social_twitter TEXT, -- Redes Sociales
    social_telegram TEXT,
    social_discord TEXT,
    commercial_description TEXT, -- Descripción Comercial de la Marca
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supplier_comm_supp ON public.supplier_commercial_profiles(supplier_id);

-- 5. TABLA: CONFIGURACIÓN DE FORMATOS DE VOUCHER (supplier_voucher_configs)
CREATE TABLE IF NOT EXISTS public.supplier_voucher_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL UNIQUE REFERENCES public.suppliers(id) ON DELETE CASCADE,
    allow_80mm BOOLEAN NOT NULL DEFAULT true,
    allow_digital BOOLEAN NOT NULL DEFAULT true,
    default_format TEXT NOT NULL DEFAULT '80mm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supplier_voucher_supp ON public.supplier_voucher_configs(supplier_id);

-- 6. SUBTABLA: CONTROL DE NOTIFICACIONES LEÍDAS (supplier_notifications_read)
CREATE TABLE IF NOT EXISTS public.supplier_notifications_read (
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    notification_id TEXT NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(supplier_id, notification_id)
);

-- 7. TABLA: PRODUCTOS (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    price_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
    price_btc NUMERIC(16,8) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active',
    sku TEXT,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    original_price_usd NUMERIC(12,2) DEFAULT 0,
    free_shipping BOOLEAN DEFAULT true,
    shipping_type TEXT DEFAULT 'free',
    rating NUMERIC(3,2) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    warranty TEXT DEFAULT '12 Meses con NovaSats.sol',
    condition TEXT DEFAULT 'Nuevo en Caja Sellada',
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migración segura de columnas si la tabla ya existe
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price_usd NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_type TEXT DEFAULT 'free';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT DEFAULT '12 Meses con NovaSats.sol';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Nuevo en Caja Sellada';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_supp ON public.products(supplier_id);

-- 8. TABLA: PREGUNTAS DE CLIENTES / Q&A (product_questions)
CREATE TABLE IF NOT EXISTS public.product_questions (
    id TEXT PRIMARY KEY DEFAULT ('qa-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6)),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_name TEXT,
    user_name TEXT NOT NULL DEFAULT 'Comprador Web3',
    user_email TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_product_questions_prod ON public.product_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_questions_supp ON public.product_questions(supplier_id);

-- 9. TABLA: CALIFICACIONES Y RESEÑAS (product_reviews)
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id TEXT PRIMARY KEY DEFAULT ('rev-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6)),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL DEFAULT 'Comprador Bitcoin',
    user_email TEXT,
    user_wallet TEXT,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    voucher_code TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_prod ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_supp ON public.product_reviews(supplier_id);

-- 10. TABLA: ÓRDENES / VENTAS (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_wallet TEXT NOT NULL,
    payment_tx_hash TEXT,
    payment_currency TEXT DEFAULT 'BTC',
    total_usd NUMERIC(12,2) NOT NULL,
    total_btc NUMERIC(16,8) NOT NULL,
    status TEXT DEFAULT 'completed',
    voucher_code TEXT UNIQUE NOT NULL,
    signature_novasats TEXT,
    contract_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_voucher ON public.orders(voucher_code);

-- 11. TABLA: ÍTEMS DE LA ORDEN (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL,
    unit_price_usd NUMERIC(12,2) NOT NULL,
    unit_price_btc NUMERIC(16,8) NOT NULL,
    total_usd NUMERIC(12,2) NOT NULL,
    total_btc NUMERIC(16,8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_supp ON public.order_items(supplier_id);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_kyc_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_commercial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_voucher_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_notifications_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Suppliers
DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
CREATE POLICY "Public read suppliers" ON public.suppliers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert suppliers" ON public.suppliers;
CREATE POLICY "Public insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update suppliers" ON public.suppliers;
CREATE POLICY "Public update suppliers" ON public.suppliers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete suppliers" ON public.suppliers;
CREATE POLICY "Public delete suppliers" ON public.suppliers FOR DELETE USING (true);

-- Supplier Wallets
DROP POLICY IF EXISTS "Public read supplier_wallets" ON public.supplier_wallets;
CREATE POLICY "Public read supplier_wallets" ON public.supplier_wallets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert supplier_wallets" ON public.supplier_wallets;
CREATE POLICY "Public insert supplier_wallets" ON public.supplier_wallets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update supplier_wallets" ON public.supplier_wallets;
CREATE POLICY "Public update supplier_wallets" ON public.supplier_wallets FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete supplier_wallets" ON public.supplier_wallets;
CREATE POLICY "Public delete supplier_wallets" ON public.supplier_wallets FOR DELETE USING (true);

-- Supplier KYC Fiscal
DROP POLICY IF EXISTS "Public read supplier_kyc_fiscal" ON public.supplier_kyc_fiscal;
CREATE POLICY "Public read supplier_kyc_fiscal" ON public.supplier_kyc_fiscal FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert supplier_kyc_fiscal" ON public.supplier_kyc_fiscal;
CREATE POLICY "Public insert supplier_kyc_fiscal" ON public.supplier_kyc_fiscal FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update supplier_kyc_fiscal" ON public.supplier_kyc_fiscal;
CREATE POLICY "Public update supplier_kyc_fiscal" ON public.supplier_kyc_fiscal FOR UPDATE USING (true);

-- Supplier Commercial Profiles
DROP POLICY IF EXISTS "Public read supplier_commercial_profiles" ON public.supplier_commercial_profiles;
CREATE POLICY "Public read supplier_commercial_profiles" ON public.supplier_commercial_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert supplier_commercial_profiles" ON public.supplier_commercial_profiles;
CREATE POLICY "Public insert supplier_commercial_profiles" ON public.supplier_commercial_profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update supplier_commercial_profiles" ON public.supplier_commercial_profiles;
CREATE POLICY "Public update supplier_commercial_profiles" ON public.supplier_commercial_profiles FOR UPDATE USING (true);

-- Supplier Voucher Configs
DROP POLICY IF EXISTS "Public read supplier_voucher_configs" ON public.supplier_voucher_configs;
CREATE POLICY "Public read supplier_voucher_configs" ON public.supplier_voucher_configs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert supplier_voucher_configs" ON public.supplier_voucher_configs;
CREATE POLICY "Public insert supplier_voucher_configs" ON public.supplier_voucher_configs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update supplier_voucher_configs" ON public.supplier_voucher_configs;
CREATE POLICY "Public update supplier_voucher_configs" ON public.supplier_voucher_configs FOR UPDATE USING (true);

-- Supplier Read Notifications
DROP POLICY IF EXISTS "Public read supplier_notifications_read" ON public.supplier_notifications_read;
CREATE POLICY "Public read supplier_notifications_read" ON public.supplier_notifications_read FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert supplier_notifications_read" ON public.supplier_notifications_read;
CREATE POLICY "Public insert supplier_notifications_read" ON public.supplier_notifications_read FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete supplier_notifications_read" ON public.supplier_notifications_read;
CREATE POLICY "Public delete supplier_notifications_read" ON public.supplier_notifications_read FOR DELETE USING (true);

-- Products
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert products" ON public.products;
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update products" ON public.products;
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete products" ON public.products;
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

-- Product Questions
DROP POLICY IF EXISTS "Public read product_questions" ON public.product_questions;
CREATE POLICY "Public read product_questions" ON public.product_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert product_questions" ON public.product_questions;
CREATE POLICY "Public insert product_questions" ON public.product_questions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update product_questions" ON public.product_questions;
CREATE POLICY "Public update product_questions" ON public.product_questions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete product_questions" ON public.product_questions;
CREATE POLICY "Public delete product_questions" ON public.product_questions FOR DELETE USING (true);

-- Product Reviews
DROP POLICY IF EXISTS "Public read product_reviews" ON public.product_reviews;
CREATE POLICY "Public read product_reviews" ON public.product_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert product_reviews" ON public.product_reviews;
CREATE POLICY "Public insert product_reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update product_reviews" ON public.product_reviews;
CREATE POLICY "Public update product_reviews" ON public.product_reviews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete product_reviews" ON public.product_reviews;
CREATE POLICY "Public delete product_reviews" ON public.product_reviews FOR DELETE USING (true);

-- Orders & Items
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update order_items" ON public.order_items;
CREATE POLICY "Public update order_items" ON public.order_items FOR UPDATE USING (true);
