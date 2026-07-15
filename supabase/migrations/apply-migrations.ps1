# Apply the PrinceSteve Residence security + workflow fixes to Supabase.
#
# Two options:
#   1) Easiest: paste the contents of
#      supabase/migrations/apply_2026_security_and_fixes.sql
#      into the Supabase Dashboard -> SQL Editor and click "Run".
#
#   2) CLI (requires Docker for a LOCAL link, or use `supabase db push` against a
#      linked remote). From a machine with Docker + the Supabase CLI:
#        supabase db push
#
# This script optionally applies the bundle via psql if you provide a
# DATABASE_URL (postgres:// connection string with pooler/direct role).
param(
  [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"
$bundle = Join-Path $PSScriptRoot "apply_2026_security_and_fixes.sql"

if (-not (Test-Path $bundle)) {
  Write-Error "Bundle not found: $bundle"
}

if (-not $DatabaseUrl) {
  Write-Host "No -DatabaseUrl supplied. Open the SQL Editor and run:" -ForegroundColor Yellow
  Write-Host "  $bundle" -ForegroundColor Cyan
  Write-Host "Then run the verification queries in VERIFY.md." -ForegroundColor Yellow
  exit 0
}

Write-Host "Applying bundle via psql..."
$env:PGPASSWORD = ([uri]$DatabaseUrl).UserInfo.Split(":")[-1]
psql "$DatabaseUrl" -f "$bundle" -v ON_ERROR_STOP=1
if ($LASTEXITCODE -eq 0) {
  Write-Host "Migrations applied successfully." -ForegroundColor Green
} else {
  Write-Error "psql exited with code $LASTEXITCODE"
}
