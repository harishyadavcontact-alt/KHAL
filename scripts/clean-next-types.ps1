param(
  [string]$Path = "apps/web/.next/types"
)

if (Test-Path $Path) {
  Remove-Item -Recurse -Force $Path
  Write-Host "Removed $Path"
} else {
  Write-Host "No generated types directory at $Path"
}
