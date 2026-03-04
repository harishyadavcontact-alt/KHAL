$ErrorActionPreference = "Stop"
$startedAt = Get-Date
New-Item -ItemType Directory -Force -Path artifacts/quality | Out-Null

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )
  Write-Host $Name
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Name (exit code $LASTEXITCODE)"
  }
}

Invoke-Step "[1/10] npm ci" { npm ci }
Invoke-Step "[2/10] db:init" { npm run db:init }
Invoke-Step "[3/10] typecheck" { npm run typecheck }
Invoke-Step "[4/10] build" { npm run build }
Invoke-Step "[5/10] web tests" { npm --workspace @khal/web run test }
Invoke-Step "[6/10] sync-engine tests" { npm --workspace @khal/sync-engine run test }
Invoke-Step "[7/10] ensure port 3010 is free" { powershell -NoProfile -ExecutionPolicy Bypass -File scripts/ensure-port-3010.ps1 -Port 3010 }

Write-Host "[8/10] start web server"
$job = Start-Job -ScriptBlock {
  Set-Location "E:/KHAL"
  npm --workspace @khal/web run start
}

$ready = $false
for ($i = 0; $i -lt 45; $i++) {
  try {
    $status = (Invoke-WebRequest -UseBasicParsing "http://localhost:3010/api/decision-spec" -TimeoutSec 2).StatusCode
    if ($status -eq 200) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Seconds 1
  }
}
if (-not $ready) {
  Stop-Job $job -ErrorAction SilentlyContinue
  Receive-Job $job -Keep -ErrorAction SilentlyContinue | Out-Null
  throw "Server did not become ready on :3010"
}

Write-Host "[9/10] smoke + perf"
node scripts/smoke-routes.mjs --baseUrl=http://localhost:3010
if ($LASTEXITCODE -ne 0) { throw "Smoke routes failed." }
node scripts/perf-smoke.mjs --baseUrl=http://localhost:3010
if ($LASTEXITCODE -ne 0) { throw "Perf smoke failed." }

Write-Host "[10/10] qa summary"
node scripts/qa-report.mjs
if ($LASTEXITCODE -ne 0) { throw "QA summary failed." }

Stop-Job $job -ErrorAction SilentlyContinue
Receive-Job $job -Keep -ErrorAction SilentlyContinue | Out-Null

$finishedAt = Get-Date
$report = [ordered]@{
  suite = "quality-gate"
  status = "passed"
  startedAt = $startedAt.ToString("o")
  finishedAt = $finishedAt.ToString("o")
  failures = @()
  metrics = @{
    durationSeconds = [int]($finishedAt - $startedAt).TotalSeconds
  }
}
$report | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 artifacts/quality/quality-gate.json
Write-Host "Quality gate passed."
