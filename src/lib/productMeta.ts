export interface ProductExtraMeta {
  images?: string[];
  discount_percent?: number;
  original_price_usd?: number;
  shipping_type?: 'free' | 'express' | 'standard';
  free_shipping?: boolean;
  rating?: number;
  reviews_count?: number;
  warranty?: string;
  condition?: string;
}

const META_REGEX = /<!--NOVASATS_META:([\s\S]*?)-->/;

/**
 * Extracts clean user description and embedded metadata object from raw database text
 */
export function parseProductDescription(rawDescription?: string | null): {
  cleanDescription: string;
  meta: ProductExtraMeta;
} {
  if (!rawDescription) {
    return { cleanDescription: '', meta: {} };
  }

  const match = rawDescription.match(META_REGEX);
  if (match && match[1]) {
    try {
      const meta = JSON.parse(match[1]) as ProductExtraMeta;
      const cleanDescription = rawDescription.replace(META_REGEX, '').trim();
      return { cleanDescription, meta };
    } catch {
      // fallback
    }
  }

  return { cleanDescription: rawDescription.trim(), meta: {} };
}

/**
 * Encodes clean description with structured extra metadata as an invisible HTML comment
 */
export function encodeProductDescription(
  cleanDescription: string,
  meta: ProductExtraMeta
): string {
  const metaFiltered = Object.fromEntries(
    Object.entries(meta).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );

  if (Object.keys(metaFiltered).length === 0) {
    return cleanDescription.trim();
  }

  return `${cleanDescription.trim()}\n\n<!--NOVASATS_META:${JSON.stringify(metaFiltered)}-->`;
}
