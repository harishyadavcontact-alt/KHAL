$ErrorActionPreference = "Stop"
$startedAt = Get-Date
New-Item -ItemType Directory -Force -Path artifacts/quality | Out-Null
$job = $null

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

try {
  Invoke-Step "[1/12] workflow audit" { node scripts/audit-workflows.mjs }
  Invoke-Step "[2/12] npm ci" { npm ci }
  Invoke-Step "[3/12] db:init" { npm run db:init }
  Invoke-Step "[4/12] docs sync" { npm run docs:sync }
  Invoke-Step "[5/12] typecheck" { npm run typecheck }
  Invoke-Step "[6/12] build" { npm run build }
  Invoke-Step "[7/12] web tests" { npm --workspace @khal/web run test }
  Invoke-Step "[8/12] sync-engine tests" { npm --workspace @khal/sync-engine run test }
  Invoke-Step "[9/12] ensure port 3010 is free" { powershell -NoProfile -ExecutionPolicy Bypass -File scripts/ensure-port-3010.ps1 -Port 3010 }

  Write-Host "[10/12] start web server"
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
    }
    catch {
      Start-Sleep -Seconds 1
    }
  }
  if (-not $ready) {
    throw "Server did not become ready on :3010"
  }

  Write-Host "[11/12] smoke + perf"
  node scripts/smoke-routes.mjs --baseUrl=http://localhost:3010
  if ($LASTEXITCODE -ne 0) { throw "Smoke routes failed." }
  node scripts/perf-smoke.mjs --baseUrl=http://localhost:3010
  if ($LASTEXITCODE -ne 0) { throw "Perf smoke failed." }

  Write-Host "[12/12] qa summary"
  node scripts/qa-report.mjs
  if ($LASTEXITCODE -ne 0) { throw "QA summary failed." }

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
}
finally {
  if ($job -ne $null) {
    Stop-Job $job -ErrorAction SilentlyContinue
    Receive-Job $job -Keep -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $job -ErrorAction SilentlyContinue
  }
}
