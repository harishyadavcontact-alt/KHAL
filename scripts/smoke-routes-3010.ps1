param(
  [string]$BaseUrl = "http://localhost:3010"
)

$routes = @(
  "/brand",
  "/khal/logo",
  "/khal/wordmark",
  "/home",
  "/dashboard",
  "/war-room",
  "/missionCommand",
  "/source-of-volatility",
  "/maya",
  "/interests",
  "/affairs",
  "/war-gaming/affair",
  "/war-gaming/source",
  "/war-gaming/domain",
  "/war-gaming/interest",
  "/war-gaming/mission",
  "/war-gaming/lineage",
  "/surgical-execution",
  "/crafts-library",
  "/time-horizon",
  "/lineage-map"
)

Write-Host "Smoke check against $BaseUrl"

$failed = @()

foreach ($route in $routes) {
  $url = "$BaseUrl$route"
  try {
    $statusCode = (Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 12).StatusCode
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    } else {
      $statusCode = 0
    }
  }

  if ($statusCode -ne 200) {
    $failed += "$route => $statusCode"
    Write-Host "FAIL $route ($statusCode)"
  } else {
    Write-Host "OK   $route (200)"
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Route smoke failed: " + ($failed -join "; "))
  exit 1
}

Write-Host "Route smoke passed."
exit 0
