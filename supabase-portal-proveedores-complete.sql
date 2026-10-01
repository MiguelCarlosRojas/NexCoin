-- ==============================================================================
-- NOVASATS MARKETPLACE: ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE
-- PORTAL DE PROVEEDORES & GESTIÓN PRINCIPAL (100% RELACIONAL & LIMPIO)
-- ==============================================================================
-- INSTRUCCIONES:
-- Ejecuta este script directamente en el SQL Editor de tu proyecto Supabase.
-- Este script:
-- 1. Elimina (DROP) todas las tablas y registros antiguos en cascada.
-- 2. Crea las tablas desde cero con claves primarias UUID (uid) y claves foráneas.
-- 3. Habilita Row Level Security (RLS) con políticas de acceso completas.
-- 4. Habilita WebSockets / Supabase Realtime para notificaciones y socket en vivo.
-- 5. Deja la base de datos 100% VACÍA (cero registros), lista para producción.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PASO 1: ELIMINAR TABLAS PREVIAS Y REGISTROS EN CASCADA
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.product_reviews CASCADE;
DROP TABLE IF EXISTS public.product_questions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.supplier_notifications_read CASCADE;
DROP TABLE IF EXISTS public.supplier_voucher_configs CASCADE;
DROP TABLE IF EXISTS public.supplier_commercial_profiles CASCADE;
DROP TABLE IF EXISTS public.supplier_kyc_fiscal CASCADE;
DROP TABLE IF EXISTS public.supplier_wallets CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- ------------------------------------------------------------------------------
-- PASO 2: CREACIÓN DE TODAS LAS TABLAS DEL PORTAL Y MARKETPLACE
-- ------------------------------------------------------------------------------

-- 1. TABLA PRINCIPAL: PROVEEDORES & IDENTIDAD (suppliers)
-- Sección: Identidad Visual & Blobatar (blobatar_identifier, company_name)
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    wallet_address TEXT,
    avatar_url TEXT,
    blobatar_identifier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBTABLA: BILLETERAS DE COBRO / RECAUDACIÓN (supplier_wallets)
-- Sección: Billeteras & Cobros
CREATE TABLE public.supplier_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT 'Billetera de Cobro',
    network TEXT NOT NULL DEFAULT 'Ethereum / EVM',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_supplier_wallets_supp ON public.supplier_wallets(supplier_id);

-- 3. TABLA: REGISTRO DE INFORMACIÓN FISCAL Y CUMPLIMIENTO (supplier_kyc_fiscal)
-- Sección: Datos Fiscales (KYC)
CREATE TABLE public.supplier_kyc_fiscal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL UNIQUE REFERENCES public.suppliers(id) ON DELETE CASCADE,
    legal_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Perú',
    business_address TEXT NOT NULL,
    legal_representative_name TEXT,
    legal_representative_id_doc TEXT,
    tax_resolution TEXT,
    official_receipt_type TEXT,
    fiscal_email TEXT,
    fiscal_phone TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    verification_hash TEXT,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_supplier_kyc_supp ON public.supplier_kyc_fiscal(supplier_id);

-- 4. TABLA: DATOS COMERCIALES DE LA EMPRESA / MARCA (supplier_commercial_profiles)
-- Sección: Datos Comerciales
CREATE TABLE public.supplier_commercial_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL UNIQUE REFERENCES public.suppliers(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    commercial_activity TEXT,
    website_url TEXT,
    support_email TEXT,
    customer_phone TEXT,
    whatsapp_number TEXT,
    commercial_address TEXT,
    social_twitter TEXT,
    social_telegram TEXT,
    social_discord TEXT,
    commercial_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_supplier_comm_supp ON public.supplier_commercial_profiles(supplier_id);

-- 5. TABLA: CONFIGURACIÓN DE FORMATOS DE VOUCHER (supplier_voucher_configs)
-- Sección: Formatos de Voucher
CREATE TABLE public.supplier_voucher_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL UNIQUE REFERENCES public.suppliers(id) ON DELETE CASCADE,
    allow_80mm BOOLEAN NOT NULL DEFAULT true,
    allow_digital BOOLEAN NOT NULL DEFAULT true,
    default_format TEXT NOT NULL DEFAULT '80mm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_supplier_voucher_supp ON public.supplier_voucher_configs(supplier_id);

-- 6. SUBTABLA: CONTROL DE NOTIFICACIONES LEÍDAS (supplier_notifications_read)
CREATE TABLE public.supplier_notifications_read (
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    notification_id TEXT NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(supplier_id, notification_id)
);

-- 7. TABLA: CATÁLOGO DE PRODUCTOS (products)
-- Sección: Mis Productos
CREATE TABLE public.products (
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
CREATE INDEX idx_products_supp ON public.products(supplier_id);
CREATE INDEX idx_products_status ON public.products(status);

-- 8. TABLA: PREGUNTAS DE CLIENTES / Q&A (product_questions)
-- Sección: Preguntas de Clientes
CREATE TABLE public.product_questions (
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
CREATE INDEX idx_product_questions_prod ON public.product_questions(product_id);
CREATE INDEX idx_product_questions_supp ON public.product_questions(supplier_id);

-- 9. TABLA: CALIFICACIONES Y RESEÑAS (product_reviews)
-- Sección: Calificaciones & Reseñas
CREATE TABLE public.product_reviews (
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
CREATE INDEX idx_product_reviews_prod ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_supp ON public.product_reviews(supplier_id);

-- 10. TABLA: ÓRDENES / VENTAS (orders)
-- Sección: Carrito y Ventas
CREATE TABLE public.orders (
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
CREATE INDEX idx_orders_voucher ON public.orders(voucher_code);

-- 11. TABLA: DETALLE DE ÍTEMS DE LA ORDEN (order_items)
CREATE TABLE public.order_items (
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
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_supp ON public.order_items(supplier_id);

-- ------------------------------------------------------------------------------
-- PASO 3: POLÍTICAS DE SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ------------------------------------------------------------------------------
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

-- Suppliers Policies
CREATE POLICY "Allow select suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update suppliers" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow delete suppliers" ON public.suppliers FOR DELETE USING (true);

-- Wallets Policies
CREATE POLICY "Allow select supplier_wallets" ON public.supplier_wallets FOR SELECT USING (true);
CREATE POLICY "Allow insert supplier_wallets" ON public.supplier_wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update supplier_wallets" ON public.supplier_wallets FOR UPDATE USING (true);
CREATE POLICY "Allow delete supplier_wallets" ON public.supplier_wallets FOR DELETE USING (true);

-- KYC Fiscal Policies
CREATE POLICY "Allow select supplier_kyc_fiscal" ON public.supplier_kyc_fiscal FOR SELECT USING (true);
CREATE POLICY "Allow insert supplier_kyc_fiscal" ON public.supplier_kyc_fiscal FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update supplier_kyc_fiscal" ON public.supplier_kyc_fiscal FOR UPDATE USING (true);

-- Commercial Profiles Policies
CREATE POLICY "Allow select supplier_commercial_profiles" ON public.supplier_commercial_profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert supplier_commercial_profiles" ON public.supplier_commercial_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update supplier_commercial_profiles" ON public.supplier_commercial_profiles FOR UPDATE USING (true);

-- Voucher Configs Policies
CREATE POLICY "Allow select supplier_voucher_configs" ON public.supplier_voucher_configs FOR SELECT USING (true);
CREATE POLICY "Allow insert supplier_voucher_configs" ON public.supplier_voucher_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update supplier_voucher_configs" ON public.supplier_voucher_configs FOR UPDATE USING (true);

-- Read Notifications Policies
CREATE POLICY "Allow select supplier_notifications_read" ON public.supplier_notifications_read FOR SELECT USING (true);
CREATE POLICY "Allow insert supplier_notifications_read" ON public.supplier_notifications_read FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete supplier_notifications_read" ON public.supplier_notifications_read FOR DELETE USING (true);

-- Products Policies
CREATE POLICY "Allow select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow delete products" ON public.products FOR DELETE USING (true);

-- Product Questions Policies
CREATE POLICY "Allow select product_questions" ON public.product_questions FOR SELECT USING (true);
CREATE POLICY "Allow insert product_questions" ON public.product_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update product_questions" ON public.product_questions FOR UPDATE USING (true);
CREATE POLICY "Allow delete product_questions" ON public.product_questions FOR DELETE USING (true);

-- Product Reviews Policies
CREATE POLICY "Allow select product_reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Allow insert product_reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update product_reviews" ON public.product_reviews FOR UPDATE USING (true);
CREATE POLICY "Allow delete product_reviews" ON public.product_reviews FOR DELETE USING (true);

-- Orders Policies
CREATE POLICY "Allow select orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true);

-- Order Items Policies
CREATE POLICY "Allow select order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update order_items" ON public.order_items FOR UPDATE USING (true);

-- ------------------------------------------------------------------------------
-- PASO 4: HABILITACIÓN DE SUPABASE REALTIME (WEBSOCKET / SOCKETS)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_questions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ------------------------------------------------------------------------------
-- FIN DEL SCRIPT: BASE DE DATOS LIMPIA, ESTRUCTURADA Y 100% VACÍA
-- ------------------------------------------------------------------------------
