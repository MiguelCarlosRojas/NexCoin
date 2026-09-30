import { Product } from '../types/store';
import { supabase } from '../lib/supabaseClient';
import { parseProductDescription } from '../lib/productMeta';

export const BTC_PRICE_USD = 65000;

/**
 * Fetch all active real products directly from Supabase.
 * Enriches each item with structured metadata parsed from description.
 */
export async function fetchAllStoreProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, suppliers(company_name, email, wallet_address, avatar_url)')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((item) => {
        const { cleanDescription, meta } = parseProductDescription(item.description);
        const imagesList = meta.images && meta.images.length > 0 ? meta.images : (item.image_url ? [item.image_url] : []);
        
        return {
          ...item,
          description: cleanDescription || item.description,
          images: imagesList,
          discount_percent: meta.discount_percent ?? (item.discount_percent || 0),
          original_price_usd: meta.original_price_usd ?? (item.original_price_usd || item.price_usd),
          free_shipping: meta.free_shipping ?? (item.free_shipping || meta.shipping_type === 'free' || item.shipping_type === 'free' || false),
          shipping_type: meta.shipping_type ?? (item.shipping_type || 'standard'),
          rating: meta.rating ?? (item.rating || 5.0),
          reviews_count: meta.reviews_count ?? (item.reviews_count || 0),
          warranty: meta.warranty ?? (item.warranty || 'Garantía del Proveedor'),
          condition: meta.condition ?? (item.condition || 'Nuevo')
        };
      });
    }
    return [];
  } catch (e) {
    console.error('Error fetching real products from Supabase:', e);
    return [];
  }
}

/**
 * Fetch a specific product by its real Supabase UUID or SKU.
 * Returns null if not found (strictly real data, no fake fallbacks).
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!id) return null;

  try {
    // 1. Direct query by primary ID
    const { data, error } = await supabase
      .from('products')
      .select('*, suppliers(company_name, email, wallet_address, avatar_url)')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      const { cleanDescription, meta } = parseProductDescription(data.description);
      const imagesList = meta.images && meta.images.length > 0 ? meta.images : (data.image_url ? [data.image_url] : []);
      return {
        ...data,
        description: cleanDescription || data.description,
        images: imagesList,
        discount_percent: meta.discount_percent ?? (data.discount_percent || 0),
        original_price_usd: meta.original_price_usd ?? (data.original_price_usd || data.price_usd),
        free_shipping: meta.free_shipping ?? (data.free_shipping || meta.shipping_type === 'free' || data.shipping_type === 'free' || false),
        shipping_type: meta.shipping_type ?? (data.shipping_type || 'standard'),
        rating: meta.rating ?? (data.rating || 5.0),
        reviews_count: meta.reviews_count ?? (data.reviews_count || 0),
        warranty: meta.warranty ?? (data.warranty || 'Garantía del Proveedor'),
        condition: meta.condition ?? (data.condition || 'Nuevo')
      };
    }

    // 2. Fallback query by SKU if ID didn't match
    const { data: skuData } = await supabase
      .from('products')
      .select('*, suppliers(company_name, email, wallet_address, avatar_url)')
      .eq('sku', id)
      .maybeSingle();

    if (skuData) {
      const { cleanDescription, meta } = parseProductDescription(skuData.description);
      const imagesList = meta.images && meta.images.length > 0 ? meta.images : (skuData.image_url ? [skuData.image_url] : []);
      return {
        ...skuData,
        description: cleanDescription || skuData.description,
        images: imagesList,
        discount_percent: meta.discount_percent ?? (skuData.discount_percent || 0),
        original_price_usd: meta.original_price_usd ?? (skuData.original_price_usd || skuData.price_usd),
        free_shipping: meta.free_shipping ?? (skuData.free_shipping || meta.shipping_type === 'free' || skuData.shipping_type === 'free' || false),
        shipping_type: meta.shipping_type ?? (skuData.shipping_type || 'standard'),
        rating: meta.rating ?? (skuData.rating || 5.0),
        reviews_count: meta.reviews_count ?? (skuData.reviews_count || 0),
        warranty: meta.warranty ?? (skuData.warranty || 'Garantía del Proveedor'),
        condition: meta.condition ?? (skuData.condition || 'Nuevo')
      };
    }
  } catch (e) {
    console.error('Error fetching product by ID from Supabase:', e);
  }

  return null;
}
