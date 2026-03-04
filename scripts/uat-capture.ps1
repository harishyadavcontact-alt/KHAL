$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path artifacts/quality | Out-Null

$now = Get-Date
$template = [ordered]@{
  suite = "uat-report"
  status = "pending-manual-signoff"
  startedAt = $now.ToString("o")
  finishedAt = $null
  failures = @()
  metrics = @{
    missionaryFlow = "PENDING"
    visionaryFlow = "PENDING"
    sourceMode = "PENDING"
    domainMode = "PENDING"
    affairMode = "PENDING"
    interestMode = "PENDING"
    craftMode = "PENDING"
    lineageMode = "PENDING"
    missionMode = "PENDING"
    humanClarityLt1s = "PENDING"
  }
  notes = "Fill this file after running docs/uat/v0.4.3-uat-checklist.md and attach evidence references."
}

$template | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 artifacts/quality/uat-report.json
Write-Host "Generated artifacts/quality/uat-report.json"
