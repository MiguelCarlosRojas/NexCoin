import {
  happy,
  love,
  wink,
  thinking,
  smug,
  surprised,
  shy,
  mad,
  sleepy,
  idle,
} from 'blobatar/expression';

export interface BlobatarConfig {
  seed: string;
  expressionKey: string;
  shapeKey: string;
  glowKey: string;
  animMode: 'hover' | 'always' | 'static';
}

export const BLOBATAR_EXPRESSIONS: Record<string, { label: string; desc: string; icon: string; expr: any }> = {
  happy: { label: 'Feliz / Radiante', desc: 'Sonrisa entusiasta y mirada positiva', icon: '😄', expr: happy },
  love: { label: 'Enamorado / Fan', desc: 'Ojos de corazones y devoción cripto', icon: '😍', expr: love },
  wink: { label: 'Pícaro / Guiño', desc: 'Guiño de ojo para tratos rápidos', icon: '😉', expr: wink },
  thinking: { label: 'Analítico / Pensativo', desc: 'Mirada calculadora de trader DeFi', icon: '🤔', expr: thinking },
  smug: { label: 'Seguro / Triunfante', desc: 'Confianza de minero en bullrun', icon: '😏', expr: smug },
  surprised: { label: 'Sorprendido / Bullish', desc: 'Ojos abiertos ante un all-time high', icon: '😲', expr: surprised },
  shy: { label: 'Modesto / Reservado', desc: 'Mejillas sonrojadas y bajo perfil', icon: '😊', expr: shy },
  mad: { label: 'Decidido / Feroz', desc: 'Determinación ante la volatilidad', icon: '😤', expr: mad },
  sleepy: { label: 'Relajado / Zen', desc: 'Paz mental con HODL a largo plazo', icon: '😴', expr: sleepy },
  idle: { label: 'Neutral / Clásico', desc: 'Expresión estándar equilibrada', icon: '😐', expr: idle },
};

export const BLOBATAR_SHAPES = [
  { id: 'circle', label: 'Círculo', class: 'rounded-full' },
  { id: 'squircle', label: 'Squircle', class: 'rounded-3xl' },
  { id: 'rounded', label: 'Suave', class: 'rounded-2xl' },
  { id: 'sharp', label: 'Compacto', class: 'rounded-xl' },
];

export const BLOBATAR_GLOWS = [
  { id: 'amber', label: 'Bitcoin Amber', border: 'border-amber-500/50', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]', color: '#f59e0b' },
  { id: 'emerald', label: 'Web3 Emerald', border: 'border-emerald-500/50', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]', color: '#10b981' },
  { id: 'blue', label: 'Ethereum Blue', border: 'border-blue-500/50', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.35)]', color: '#3b82f6' },
  { id: 'purple', label: 'Solana Purple', border: 'border-purple-500/50', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]', color: '#a855f7' },
  { id: 'cyan', label: 'Cyber Cyan', border: 'border-cyan-400/50', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]', color: '#06b6d4' },
  { id: 'none', label: 'Minimalista', border: 'border-white/10', glow: 'shadow-none', color: '#64748b' },
];

export function serializeBlobatar(config: BlobatarConfig): string {
  return `blobatar:v2:${encodeURIComponent(JSON.stringify(config))}`;
}

export function getBlobatarAnimate(mode: 'hover' | 'always' | 'static'): 'hover' | 'always' | undefined {
  return mode === 'static' ? undefined : mode;
}

export function parseBlobatar(rawUrl?: string | null, fallbackSeed: string = 'NovaSats'): {
  seed: string;
  expression: any;
  expressionKey: string;
  shapeKey: string;
  glowKey: string;
  animMode: 'hover' | 'always' | 'static';
  animProp: 'hover' | 'always' | undefined;
  shapeClass: string;
  glowClass: string;
  borderClass: string;
} {
  let seed = fallbackSeed;
  let expressionKey = 'happy';
  let shapeKey = 'squircle';
  let glowKey = 'amber';
  let animMode: 'hover' | 'always' | 'static' = 'hover';

  if (rawUrl) {
    if (rawUrl.startsWith('blobatar:v2:')) {
      try {
        const decoded = JSON.parse(decodeURIComponent(rawUrl.replace('blobatar:v2:', '')));
        if (decoded.seed) seed = decoded.seed;
        if (decoded.expressionKey && BLOBATAR_EXPRESSIONS[decoded.expressionKey]) {
          expressionKey = decoded.expressionKey;
        }
        if (decoded.shapeKey && BLOBATAR_SHAPES.some((s) => s.id === decoded.shapeKey)) {
          shapeKey = decoded.shapeKey;
        }
        if (decoded.glowKey && BLOBATAR_GLOWS.some((g) => g.id === decoded.glowKey)) {
          glowKey = decoded.glowKey;
        }
        if (decoded.animMode) {
          animMode = decoded.animMode;
        }
      } catch (e) {
        console.error('Error decoding blobatar:v2 URL:', e);
      }
    } else if (rawUrl.startsWith('blobatar:')) {
      seed = rawUrl.replace('blobatar:', '') || fallbackSeed;
    }
  }

  const shapeObj = BLOBATAR_SHAPES.find((s) => s.id === shapeKey) || BLOBATAR_SHAPES[1];
  const glowObj = BLOBATAR_GLOWS.find((g) => g.id === glowKey) || BLOBATAR_GLOWS[0];
  const exprObj = BLOBATAR_EXPRESSIONS[expressionKey] || BLOBATAR_EXPRESSIONS.happy;

  return {
    seed,
    expression: exprObj.expr,
    expressionKey,
    shapeKey,
    glowKey,
    animMode,
    animProp: getBlobatarAnimate(animMode),
    shapeClass: shapeObj.class,
    glowClass: glowObj.glow,
    borderClass: glowObj.border,
  };
}
