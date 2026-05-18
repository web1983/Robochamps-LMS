# Sync server/.env variables to Vercel (Production).
# Prereqs: npm i -g vercel  →  vercel login  →  vercel link (from repo root)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot "server\.env"

if (-not (Test-Path $envFile)) {
    Write-Error "Missing server\.env — create it from server\.env.example first."
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Error "Vercel CLI not found. Run: npm install -g vercel"
}

$varsToSync = @(
    "MONGO_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "NODE_ENV",
    "FRONTEND_URL"
)

$parsed = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    $parsed[$key] = $val
}

if (-not $parsed["FRONTEND_URL"]) {
    $parsed["FRONTEND_URL"] = "https://robochamps-lms.vercel.app"
}
if (-not $parsed["NODE_ENV"] -or $parsed["NODE_ENV"] -eq "development") {
    $parsed["NODE_ENV"] = "production"
}

Set-Location $repoRoot
Write-Host "Linking project (skip if already linked)..." -ForegroundColor Cyan
vercel link

foreach ($name in $varsToSync) {
    $value = $parsed[$name]
    if (-not $value) {
        Write-Warning "Skipping $name (empty in server\.env)"
        continue
    }
    Write-Host "Setting $name for Production..." -ForegroundColor Green
    vercel env rm $name production -y 2>$null | Out-Null
    $value | vercel env add $name production
}

Write-Host ""
Write-Host "Done. Redeploy:" -ForegroundColor Cyan
Write-Host "  vercel --prod"
Write-Host "Then open: https://robochamps-lms.vercel.app/api/health"
Write-Host "  mongoUriConfigured and jwtConfigured should be true."
