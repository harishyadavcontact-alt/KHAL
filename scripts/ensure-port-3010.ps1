param(
  [int]$Port = 3010
)

Write-Host "Preflight: ensuring TCP port $Port is free..."

$pids = @()

try {
  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  }
} catch {
  Write-Host "Get-NetTCPConnection unavailable, falling back to netstat parse."
  $netstat = netstat -ano | Select-String ":$Port\s+.*LISTENING\s+(\d+)$"
  if ($netstat) {
    $pids = $netstat | ForEach-Object {
      if ($_ -match "(\d+)$") { [int]$Matches[1] }
    } | Select-Object -Unique
  }
}

if (-not $pids -or $pids.Count -eq 0) {
  Write-Host "Port $Port already free."
  exit 0
}

foreach ($processId in $pids) {
  if ($processId -eq $PID) {
    continue
  }
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    Write-Host "Stopped PID $processId holding port $Port."
  } catch {
    Write-Error ("Failed to stop PID {0} on port {1}: {2}" -f $processId, $Port, $_.Exception.Message)
    exit 1
  }
}

Start-Sleep -Milliseconds 400

try {
  $remaining = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($remaining) {
    $remainingPids = $remaining | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Error "Port $Port still occupied by PID(s): $($remainingPids -join ', ')"
    exit 1
  }
} catch {
  # No-op if unavailable; best effort completed.
}

Write-Host "Port $Port is now free."
exit 0
