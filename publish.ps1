# Mirrors the Prism instance's mods into this packwiz pack, then commits and pushes.
# Run this after adding/updating/removing mods in Prism. The server picks up
# the changes on its next restart.
#
#   pwsh -File publish.ps1            # sync, commit, push
#   pwsh -File publish.ps1 -DryRun    # show what would change, touch nothing
#   pwsh -File publish.ps1 -NoPush    # sync + commit, but don't push

param(
    [switch]$DryRun,
    [switch]$NoPush,
    [string]$Instance = "$env:APPDATA\PrismLauncher\instances\Slop Craft\minecraft"
)

$ErrorActionPreference = 'Stop'
$pack = $PSScriptRoot
$pw = "$env:USERPROFILE\go\bin\packwiz.exe"
$ua = @{ 'User-Agent' = 'epeterson3136/craftin-smp-packwiz' }

if (-not (Test-Path $pw)) { throw "packwiz not found at $pw" }
if (-not (Test-Path "$Instance\mods")) { throw "instance mods folder not found: $Instance\mods" }

# --- Desired state: what's in the instance right now ---
Write-Host "Hashing instance mods..." -ForegroundColor Cyan
$byHash = @{}
foreach ($j in Get-ChildItem "$Instance\mods" -Filter *.jar) {
    $byHash[(Get-FileHash -LiteralPath $j.FullName -Algorithm SHA1).Hash.ToLower()] = $j.Name
}
$body = @{ hashes = @($byHash.Keys); algorithm = 'sha1' } | ConvertTo-Json
$lookup = Invoke-RestMethod -Uri 'https://api.modrinth.com/v2/version_files' -Method Post -Body $body -ContentType 'application/json' -Headers $ua

$want = @{}       # projectId -> @{versionId, file}
$staticJars = @() # filenames with no Modrinth match
foreach ($h in $byHash.Keys) {
    $v = $lookup.$h
    if ($v) { $want[$v.project_id] = @{ versionId = $v.id; file = $byHash[$h] } }
    else { $staticJars += $byHash[$h] }
}
Write-Host "  $($want.Count) tracked via Modrinth, $($staticJars.Count) unmatched jars"

# --- Current state: what the pack says ---
$have = @{}
foreach ($t in Get-ChildItem "$pack\mods" -Filter *.pw.toml) {
    $txt = Get-Content -LiteralPath $t.FullName -Raw
    if ($txt -match 'mod-id\s*=\s*"([^"]+)"' ) {
        $id = $Matches[1]
        $ver = if ($txt -match '(?m)^version\s*=\s*"([^"]+)"') { $Matches[1] } else { '' }
        $have[$id] = @{ versionId = $ver; path = $t.FullName; name = $t.Name }
    }
}

$toAdd    = $want.Keys | Where-Object { -not $have.ContainsKey($_) }
$toUpdate = $want.Keys | Where-Object { $have.ContainsKey($_) -and $have[$_].versionId -ne $want[$_].versionId }
$toRemove = $have.Keys | Where-Object { -not $want.ContainsKey($_) }

Write-Host ""
Write-Host "New:     $($toAdd.Count)" -ForegroundColor Green
$toAdd    | ForEach-Object { "  + $($want[$_].file)" }
Write-Host "Updated: $($toUpdate.Count)" -ForegroundColor Yellow
$toUpdate | ForEach-Object { "  ~ $($want[$_].file)" }
Write-Host "Removed: $($toRemove.Count)" -ForegroundColor Red
$toRemove | ForEach-Object { "  - $($have[$_].name)" }

# Static (non-Modrinth) jars bundled directly in the pack
$haveStatic = (Get-ChildItem "$pack\mods" -Filter *.jar -ErrorAction SilentlyContinue).Name
$staticAdd = $staticJars | Where-Object { $_ -notin $haveStatic }
$staticDel = $haveStatic | Where-Object { $_ -notin $staticJars }
if ($staticAdd) { Write-Host "Bundled jars added:   $($staticAdd -join ', ')" -ForegroundColor Green }
if ($staticDel) { Write-Host "Bundled jars removed: $($staticDel -join ', ')" -ForegroundColor Red }

if ($DryRun) { Write-Host "`n(dry run - nothing changed)" -ForegroundColor Cyan; return }
if (-not ($toAdd -or $toUpdate -or $toRemove -or $staticAdd -or $staticDel)) {
    Write-Host "`nPack already matches the instance. Nothing to do." -ForegroundColor Cyan
    return
}

# --- Apply ---
Set-Location $pack
foreach ($id in @($toAdd) + @($toUpdate)) {
    & $pw modrinth add --project-id $id --version-id $want[$id].versionId -y 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Warning "failed to add $($want[$id].file)" }
}
foreach ($id in $toRemove) { Remove-Item -LiteralPath $have[$id].path -Force }
foreach ($f in $staticAdd) { Copy-Item -LiteralPath "$Instance\mods\$f" "$pack\mods\" -Force }
foreach ($f in $staticDel) { Remove-Item -LiteralPath "$pack\mods\$f" -Force }

# --- Re-tag sides from Modrinth project metadata ---
Write-Host "`nTagging client/server sides..." -ForegroundColor Cyan
$ids = @($want.Keys)
$projects = @()
for ($i = 0; $i -lt $ids.Count; $i += 100) {
    $chunk = $ids[$i..([Math]::Min($i + 99, $ids.Count - 1))]
    $j = '[' + (($chunk | ForEach-Object { '"' + $_ + '"' }) -join ',') + ']'
    $projects += Invoke-RestMethod -Uri "https://api.modrinth.com/v2/projects?ids=$([uri]::EscapeDataString($j))" -Headers $ua
}
$sideById = @{}
foreach ($p in $projects) {
    $sideById[$p.id] = if ($p.server_side -eq 'unsupported') { 'client' }
                       elseif ($p.client_side -eq 'unsupported') { 'server' }
                       else { 'both' }
}
$fixed = 0
foreach ($t in Get-ChildItem "$pack\mods" -Filter *.pw.toml) {
    $txt = Get-Content -LiteralPath $t.FullName -Raw
    if ($txt -match 'mod-id\s*=\s*"([^"]+)"') {
        $id = $Matches[1]
        if ($sideById.ContainsKey($id) -and $txt -match '(?m)^side\s*=\s*"([^"]+)"' -and $Matches[1] -ne $sideById[$id]) {
            Set-Content -LiteralPath $t.FullName ($txt -replace '(?m)^side\s*=\s*"[^"]+"', "side = `"$($sideById[$id])`"") -NoNewline
            $fixed++
        }
    }
}
Write-Host "  side corrections: $fixed"

& $pw refresh 2>&1 | Select-Object -Last 1

# --- Commit and push ---
$msg = "Sync from instance: +$($toAdd.Count) new, ~$($toUpdate.Count) updated, -$($toRemove.Count) removed"
git add -A
git commit -q -m $msg
Write-Host "`n$msg" -ForegroundColor Green
if (-not $NoPush) {
    git push -q
    Write-Host "Pushed. Restart the server to apply." -ForegroundColor Green
} else {
    Write-Host "Committed (not pushed)." -ForegroundColor Yellow
}
