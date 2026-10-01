import { supabase } from './supabaseClient';

export interface ProductQuestion {
  id: string;
  product_id: string;
  supplier_id?: string;
  product_name?: string;
  user_name: string;
  user_email?: string;
  question: string;
  answer?: string | null;
  answered_at?: string | null;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  supplier_id?: string;
  product_name?: string;
  user_name: string;
  user_email?: string;
  user_wallet?: string;
  rating: number; // 1 - 5
  comment: string;
  voucher_code?: string;
  verified_purchase?: boolean;
  created_at: string;
}

// Limpiar inmediatamente cualquier rastro previo en localStorage (datos solo en Supabase)
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('novasats_qa_') || key.startsWith('novasats_reviews_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// -------------------------------------------------------------
// QUESTIONS (Q&A) - 100% SUPABASE (SIN LOCAL STORAGE)
// -------------------------------------------------------------

export async function fetchProductQuestions(productId: string): Promise<ProductQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('product_questions')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al consultar product_questions en Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de red al consultar preguntas:', err);
    return [];
  }
}

export async function submitProductQuestion(payload: {
  productId: string;
  supplierId?: string;
  productName: string;
  userName: string;
  userEmail?: string;
  question: string;
}): Promise<ProductQuestion> {
  const insertPayload = {
    product_id: payload.productId,
    supplier_id: payload.supplierId || null,
    product_name: payload.productName,
    user_name: payload.userName.trim() || 'Comprador Web3',
    user_email: payload.userEmail?.trim() || null,
    question: payload.question.trim(),
    answer: null,
    answered_at: null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('product_questions')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error('Error al insertar pregunta en Supabase:', error);
    throw new Error(error.message || 'No se pudo guardar la pregunta en la base de datos');
  }

  return data;
}

export async function fetchSupplierQuestions(supplierId: string): Promise<ProductQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('product_questions')
      .select('id, product_id, supplier_id, product_name, user_name, user_email, question, answer, answered_at, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener preguntas del proveedor desde Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de red en fetchSupplierQuestions:', err);
    return [];
  }
}

export async function answerProductQuestion(
  questionId: string,
  answerText: string
): Promise<boolean> {
  const answeredAt = new Date().toISOString();

  const { error } = await supabase
    .from('product_questions')
    .update({
      answer: answerText.trim(),
      answered_at: answeredAt,
    })
    .eq('id', questionId);

  if (error) {
    console.error('Error al registrar respuesta en Supabase:', error);
    throw new Error(error.message || 'No se pudo actualizar la respuesta en la base de datos');
  }

  return true;
}

// -------------------------------------------------------------
// REVIEWS & RATINGS (OPINIONES) - 100% SUPABASE (SIN LOCAL STORAGE)
// -------------------------------------------------------------

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al consultar product_reviews en Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de red al consultar opiniones:', err);
    return [];
  }
}

export async function submitProductReview(payload: {
  productId: string;
  supplierId?: string;
  userName: string;
  userEmail?: string;
  userWallet?: string;
  rating: number;
  comment: string;
  voucherCode?: string;
  verifiedPurchase?: boolean;
}): Promise<ProductReview> {
  const insertPayload = {
    product_id: payload.productId,
    supplier_id: payload.supplierId || null,
    user_name: payload.userName.trim() || 'Comprador Bitcoin',
    user_email: payload.userEmail?.trim() || null,
    user_wallet: payload.userWallet?.trim() || null,
    rating: Math.max(1, Math.min(5, Math.round(payload.rating))),
    comment: payload.comment.trim(),
    voucher_code: payload.voucherCode?.trim() || null,
    verified_purchase: Boolean(payload.verifiedPurchase || payload.voucherCode),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('product_reviews')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error('Error al registrar opinión en Supabase:', error);
    throw new Error(error.message || 'No se pudo guardar la calificación en la base de datos');
  }

  // Recalcular calificación promedio real del producto directamente en la base de datos
  await recalculateProductRating(payload.productId);

  return data;
}

export async function recalculateProductRating(productId: string) {
  try {
    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId);

    if (error) {
      console.error('Error al obtener opiniones para recalcular promedio:', error);
      return;
    }

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((acc, r) => acc + Number(r.rating), 0) / reviews.length;
      await supabase
        .from('products')
        .update({
          rating: parseFloat(avg.toFixed(1)),
          reviews_count: reviews.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
    } else {
      // Si no tiene opiniones de compradores reales, la calificación es estrictamente 0.0
      await supabase
        .from('products')
        .update({
          rating: 0.0,
          reviews_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
    }
  } catch (err) {
    console.error('Error al actualizar rating del producto en Supabase:', err);
  }
}

export async function fetchSupplierReviews(supplierId: string): Promise<ProductReview[]> {
  try {
    // 1. Obtener productos pertenecientes al proveedor
    const { data: prods } = await supabase
      .from('products')
      .select('id, name')
      .eq('supplier_id', supplierId);

    const productIds = (prods || []).map((p) => p.id);
    const prodNameMap: Record<string, string> = {};
    (prods || []).forEach((p) => {
      prodNameMap[p.id] = p.name;
    });

    let query = supabase.from('product_reviews').select('id, product_id, supplier_id, user_name, user_email, user_wallet, rating, comment, voucher_code, verified_purchase, created_at');

    if (productIds.length > 0) {
      query = query.or(`supplier_id.eq.${supplierId},product_id.in.(${productIds.join(',')})`);
    } else {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error al consultar opiniones del proveedor en Supabase:', error);
      return [];
    }

    return (data || []).map((r) => ({
      ...r,
      product_name: prodNameMap[r.product_id] || (r as any).product_name || 'Producto del Catálogo',
    }));
  } catch (err) {
    console.error('Error de red en fetchSupplierReviews:', err);
    return [];
  }
}
