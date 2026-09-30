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
  user_name: string;
  user_email?: string;
  user_wallet?: string;
  rating: number; // 1 - 5
  comment: string;
  voucher_code?: string;
  verified_purchase?: boolean;
  created_at: string;
}

// -------------------------------------------------------------
// QUESTIONS (Q&A)
// -------------------------------------------------------------

export async function fetchProductQuestions(productId: string): Promise<ProductQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('product_questions')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase product_questions query fallback:', err);
  }

  // Graceful local cache fallback
  try {
    const cached = localStorage.getItem(`nexcoin_qa_${productId}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
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
  const newQuestion: ProductQuestion = {
    id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    product_id: payload.productId,
    supplier_id: payload.supplierId,
    product_name: payload.productName,
    user_name: payload.userName.trim(),
    user_email: payload.userEmail?.trim() || '',
    question: payload.question.trim(),
    answer: null,
    answered_at: null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('product_questions')
      .insert([
        {
          product_id: payload.productId,
          supplier_id: payload.supplierId,
          product_name: payload.productName,
          user_name: payload.userName.trim(),
          user_email: payload.userEmail?.trim() || null,
          question: payload.question.trim(),
          created_at: newQuestion.created_at,
        },
      ])
      .select()
      .maybeSingle();

    if (!error && data) {
      // Save locally as well for offline resilience
      syncQuestionToLocalStorage(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase product_questions insert fallback:', err);
  }

  // Fallback to local storage
  syncQuestionToLocalStorage(newQuestion);
  return newQuestion;
}

export async function fetchSupplierQuestions(supplierId: string): Promise<ProductQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('product_questions')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase fetchSupplierQuestions fallback:', err);
  }

  // Fallback: search all local storage keys
  const results: ProductQuestion[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nexcoin_qa_')) {
        const items: ProductQuestion[] = JSON.parse(localStorage.getItem(key) || '[]');
        items.forEach((it) => {
          if (it.supplier_id === supplierId || !it.supplier_id) {
            results.push(it);
          }
        });
      }
    }
  } catch {}
  return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function answerProductQuestion(
  questionId: string,
  answerText: string
): Promise<boolean> {
  const answeredAt = new Date().toISOString();

  try {
    const { error } = await supabase
      .from('product_questions')
      .update({
        answer: answerText.trim(),
        answered_at: answeredAt,
      })
      .eq('id', questionId);

    if (!error) {
      updateLocalQuestionAnswer(questionId, answerText.trim(), answeredAt);
      return true;
    }
  } catch (err) {
    console.warn('Supabase answerProductQuestion fallback:', err);
  }

  // Update in local storage
  updateLocalQuestionAnswer(questionId, answerText.trim(), answeredAt);
  return true;
}

function syncQuestionToLocalStorage(item: ProductQuestion) {
  try {
    const key = `nexcoin_qa_${item.product_id}`;
    const list: ProductQuestion[] = JSON.parse(localStorage.getItem(key) || '[]');
    const existingIdx = list.findIndex((q) => q.id === item.id);
    if (existingIdx >= 0) {
      list[existingIdx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

function updateLocalQuestionAnswer(questionId: string, answer: string, answeredAt: string) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nexcoin_qa_')) {
        const list: ProductQuestion[] = JSON.parse(localStorage.getItem(key) || '[]');
        let updated = false;
        list.forEach((q) => {
          if (q.id === questionId) {
            q.answer = answer;
            q.answered_at = answeredAt;
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(key, JSON.stringify(list));
        }
      }
    }
  } catch {}
}

// -------------------------------------------------------------
// REVIEWS & RATINGS (OPINIONES)
// -------------------------------------------------------------

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase product_reviews query fallback:', err);
  }

  try {
    const cached = localStorage.getItem(`nexcoin_reviews_${productId}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
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
  const newReview: ProductReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    product_id: payload.productId,
    supplier_id: payload.supplierId,
    user_name: payload.userName.trim(),
    user_email: payload.userEmail?.trim() || '',
    user_wallet: payload.userWallet?.trim() || '',
    rating: Math.max(1, Math.min(5, Math.round(payload.rating))),
    comment: payload.comment.trim(),
    voucher_code: payload.voucherCode?.trim() || '',
    verified_purchase: Boolean(payload.verifiedPurchase || payload.voucherCode),
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert([
        {
          product_id: payload.productId,
          supplier_id: payload.supplierId,
          user_name: payload.userName.trim(),
          user_email: payload.userEmail?.trim() || null,
          user_wallet: payload.userWallet?.trim() || null,
          rating: newReview.rating,
          comment: payload.comment.trim(),
          voucher_code: payload.voucherCode?.trim() || null,
          verified_purchase: newReview.verified_purchase,
          created_at: newReview.created_at,
        },
      ])
      .select()
      .maybeSingle();

    if (!error && data) {
      syncReviewToLocalStorage(data);
      await recalculateProductRating(payload.productId);
      return data;
    }
  } catch (err) {
    console.warn('Supabase product_reviews insert fallback:', err);
  }

  syncReviewToLocalStorage(newReview);
  await recalculateProductRating(payload.productId);
  return newReview;
}

function syncReviewToLocalStorage(item: ProductReview) {
  try {
    const key = `nexcoin_reviews_${item.product_id}`;
    const list: ProductReview[] = JSON.parse(localStorage.getItem(key) || '[]');
    const existingIdx = list.findIndex((r) => r.id === item.id);
    if (existingIdx >= 0) {
      list[existingIdx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

async function recalculateProductRating(productId: string) {
  try {
    const reviews = await fetchProductReviews(productId);
    if (reviews.length > 0) {
      const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      await supabase
        .from('products')
        .update({
          rating: parseFloat(avg.toFixed(1)),
          reviews_count: reviews.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
    }
  } catch {}
}
