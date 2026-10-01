import { Supplier } from '../types/store';

const COOKIE_NAME = 'novasats_supplier_session';
const COOKIE_MAX_AGE_DAYS = 7;

/**
 * Helper to get a cookie value by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Helper to set a cookie with path, max-age, SameSite, and Secure flags
 */
export function setCookie(name: string, value: string, days: number = COOKIE_MAX_AGE_DAYS): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
}

/**
 * Helper to remove a cookie
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Retrieve supplier session strictly from browser cookies
 * (Cleans up any legacy localStorage entry)
 */
export function getSupplierSession(): Supplier | null {
  try {
    const cookieVal = getCookie(COOKIE_NAME);
    if (cookieVal) {
      const parsed = JSON.parse(cookieVal);
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.email) {
        // Clean any legacy localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('novasats_supplier');
          localStorage.removeItem('supabase_supplier_session');
        }
        return parsed as Supplier;
      }
    }

    // Migration fallback: if cookie doesn't exist but legacy localStorage exists, migrate to cookie
    if (typeof localStorage !== 'undefined') {
      const legacy = localStorage.getItem('novasats_supplier');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        localStorage.removeItem('novasats_supplier');
        localStorage.removeItem('supabase_supplier_session');
        if (parsed && parsed.id) {
          setSupplierSession(parsed);
          return parsed as Supplier;
        }
      }
    }
  } catch (err) {
    console.error('Error parsing supplier cookie session:', err);
  }
  return null;
}

/**
 * Save supplier session into browser cookies (never into localStorage)
 */
export function setSupplierSession(supplier: Supplier): void {
  try {
    const raw = JSON.stringify(supplier);
    setCookie(COOKIE_NAME, raw, COOKIE_MAX_AGE_DAYS);
    // Ensure localStorage is cleared to adhere to cookie-only storage requirement
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('novasats_supplier');
      localStorage.removeItem('supabase_supplier_session');
    }
  } catch (err) {
    console.error('Error storing supplier cookie session:', err);
  }
}

/**
 * Clear supplier session from cookies and local storage
 */
export function clearSupplierSession(): void {
  removeCookie(COOKIE_NAME);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('novasats_supplier');
    localStorage.removeItem('supabase_supplier_session');
  }
}
