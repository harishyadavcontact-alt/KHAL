param(
  [string]$RcTag = "v0.4.4-rc1",
  [string]$FinalTag = "v0.4.4",
  [switch]$PushTags
)

$ErrorActionPreference = "Stop"

function Run-Or-Fail {
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

if ((git branch --show-current).Trim() -ne "main") {
  throw "Release packaging must run on main."
}

$status = git status --porcelain
if ($status) {
  throw "Working tree is not clean. Commit/stash changes before release packaging."
}

Run-Or-Fail "[1/4] Run full quality gate" { npm run quality:gate }
Run-Or-Fail "[2/4] Build release quality report" { node scripts/qa-report.mjs }

if (-not (git rev-parse $RcTag 2>$null)) {
  Run-Or-Fail "[3/4] Tag release candidate $RcTag" { git tag -a $RcTag -m "Release candidate $RcTag" }
} else {
  Write-Host "RC tag already exists: $RcTag"
}

if (-not (git rev-parse $FinalTag 2>$null)) {
  Run-Or-Fail "[4/4] Tag final release $FinalTag" { git tag -a $FinalTag -m "Release $FinalTag" }
} else {
  Write-Host "Final tag already exists: $FinalTag"
}

if ($PushTags) {
  Run-Or-Fail "[push] Push tags to origin" { git push origin $RcTag $FinalTag }
} else {
  Write-Host "Tags created locally only. Use -PushTags to publish."
}
