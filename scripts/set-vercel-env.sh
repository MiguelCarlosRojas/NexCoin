#!/usr/bin/env bash
# ==============================================================================
# Script de automatización de Variables de Entorno en Vercel con Vercel CLI
# ==============================================================================

set -e

echo "🪙 === Configuración de Variables de Entorno en Vercel CLI para NexCoin ==="

# 1. Verificar sesión
if ! npx vercel whoami > /dev/null 2>&1; then
    echo "⚠️ No has iniciado sesión en Vercel CLI."
    echo "Ejecuta: npx vercel login"
    exit 1
fi

echo "✅ Autenticado en Vercel."

# 2. Vincular proyecto si no existe .vercel
if [ ! -d ".vercel" ]; then
    echo "Vinculando proyecto..."
    npx vercel link --yes
fi

# 3. Leer .env
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env"
    exit 1
fi

# 4. Configurar variables
set -a
source .env
set +a

envs=("production" "preview" "development")
vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_REOWN_PROJECT_ID")

for var in "${vars[@]}"; do
    val="${!var}"
    if [ -n "$val" ]; then
        for env in "${envs[@]}"; do
            echo "-> Configurando $var en [$env]..."
            printf "%s" "$val" | npx vercel env add "$var" "$env" --force > /dev/null 2>&1 || true
        done
    fi
done

echo "🎉 ¡Variables configuradas con éxito en Vercel!"
echo "Comprueba con: npx vercel env ls"
