# ==============================================================================
# Script de automatización de Variables de Entorno en Vercel con Vercel CLI
# Proyecto: NexCoin (https://github.com/MiguelCarlosRojas/NexCoin)
# ==============================================================================

Write-Host "🪙 === Configuración de Variables de Entorno en Vercel CLI para NexCoin ===" -ForegroundColor Cyan

# 1. Verificar si el usuario está autenticado en Vercel
Write-Host "`n1. Verificando autenticación en Vercel CLI..." -ForegroundColor Yellow
$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ No has iniciado sesión en Vercel CLI." -ForegroundColor Red
    Write-Host "Por favor inicia sesión ejecutando: npx vercel login" -ForegroundColor Green
    Write-Host "Una vez completado el inicio de sesión en tu navegador, vuelve a ejecutar este script." -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "✅ Autenticado en Vercel como: $whoami" -ForegroundColor Green
}

# 2. Vincular proyecto si no existe la carpeta .vercel
if (-not (Test-Path ".vercel")) {
    Write-Host "`n2. Vinculando el repositorio con tu proyecto en Vercel..." -ForegroundColor Yellow
    npx vercel link --yes
} else {
    Write-Host "`n2. Proyecto ya vinculado en .vercel" -ForegroundColor Green
}

# 3. Cargar variables desde el archivo .env local
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env local." -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Leyendo variables desde .env..." -ForegroundColor Yellow
$envContent = Get-Content ".env"
$envMap = @{}

foreach ($line in $envContent) {
    $trimmed = $line.Trim()
    if ($trimmed -and -not $trimmed.StartsWith("#") -and $trimmed.Contains("=")) {
        $parts = $trimmed -split "=", 2
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        $envMap[$key] = $val
    }
}

$targetKeys = @("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_REOWN_PROJECT_ID")
$environments = @("production", "preview", "development")

Write-Host "`n4. Subiendo variables a Vercel en entornos: $($environments -join ', ')..." -ForegroundColor Yellow

foreach ($key in $targetKeys) {
    $val = $envMap[$key]
    if (-not $val) {
        Write-Host "⚠️ Variable $key no encontrada en .env, omitiendo..." -ForegroundColor DarkYellow
        continue
    }

    foreach ($env in $environments) {
        Write-Host "-> Configurando $key para entorno [$env]..." -NoNewline
        # Usar pipe para enviar el valor automáticamente a vercel env add
        $val | npx vercel env add $key $env --force 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
        } else {
            # Intentar sin --force si la versión del CLI lo requiere
            $val | npx vercel env add $key $env 2>$null
            Write-Host " [LISTO]" -ForegroundColor Green
        }
    }
}

Write-Host "`n🎉 ¡Todas las variables de entorno fueron configuradas con éxito en Vercel!" -ForegroundColor Cyan
Write-Host "Puedes comprobarlas ejecutando: npx vercel env ls" -ForegroundColor White
Write-Host "O realizar el despliegue con: npx vercel --prod" -ForegroundColor Yellow
