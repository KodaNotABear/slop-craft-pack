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
# Normalize filenames so browser-duplicate suffixes like "(1).jar" and case
# differences don't defeat matching.
function Normalize-Name([string]$n) { ($n -replace '\(\d+\)(?=\.jar$)', '').ToLowerInvariant() }
$instanceJarNames = [System.Collections.Generic.HashSet[string]]::new(
    [string[]]@((Get-ChildItem "$Instance\mods" -Filter *.jar).Name | ForEach-Object { Normalize-Name $_ }))

$have = @{}          # Modrinth-tracked: project id -> info
$cfTracked = @()     # CurseForge-tracked metafiles: @{path; name; filename}
$trackedFilenames = [System.Collections.Generic.HashSet[string]]::new()
foreach ($t in Get-ChildItem "$pack\mods" -Filter *.pw.toml) {
    $txt = Get-Content -LiteralPath $t.FullName -Raw
    $fname = if ($txt -match '(?m)^filename\s*=\s*"([^"]+)"') { Normalize-Name $Matches[1] } else { '' }
    if ($fname) { [void]$trackedFilenames.Add($fname) }
    if ($txt -match '\[update\.modrinth\]' -and $txt -match 'mod-id\s*=\s*"([^"]+)"') {
        $id = $Matches[1]
        $ver = if ($txt -match '(?m)^version\s*=\s*"([^"]+)"') { $Matches[1] } else { '' }
        $have[$id] = @{ versionId = $ver; path = $t.FullName; name = $t.Name; filename = $fname }
    } elseif ($txt -match '\[update\.curseforge\]') {
        $cfTracked += @{ path = $t.FullName; name = $t.Name; filename = $fname }
    }
}

$toAdd    = $want.Keys | Where-Object { -not $have.ContainsKey($_) }
$toUpdate = $want.Keys | Where-Object { $have.ContainsKey($_) -and $have[$_].versionId -ne $want[$_].versionId }
# Keep a Modrinth-tracked entry when its exact file is still in the instance,
# even if the instance jar's hash didn't match Modrinth (CurseForge-flavored
# build of the same release, e.g. Kotlin for Forge).
$toRemove = $have.Keys | Where-Object { -not $want.ContainsKey($_) -and -not $instanceJarNames.Contains($have[$_].filename) }
# CurseForge-tracked entries are managed by filename: drop them when the jar
# left the instance.
$cfRemove = $cfTracked | Where-Object { -not $instanceJarNames.Contains($_.filename) }

Write-Host ""
Write-Host "New:     $($toAdd.Count)" -ForegroundColor Green
$toAdd    | ForEach-Object { "  + $($want[$_].file)" }
Write-Host "Updated: $($toUpdate.Count)" -ForegroundColor Yellow
$toUpdate | ForEach-Object { "  ~ $($want[$_].file)" }
Write-Host "Removed: $($toRemove.Count + $cfRemove.Count)" -ForegroundColor Red
$toRemove | ForEach-Object { "  - $($have[$_].name)" }
$cfRemove | ForEach-Object { "  - $($_.name) (curseforge)" }

# Static jars: only bundle unmatched jars that no metafile (Modrinth or
# CurseForge) already covers.
$haveStatic = (Get-ChildItem "$pack\mods" -Filter *.jar -ErrorAction SilentlyContinue).Name
$staticAdd = $staticJars | Where-Object { -not $trackedFilenames.Contains((Normalize-Name $_)) -and $_ -notin $haveStatic }
$staticDel = $haveStatic | Where-Object { (Normalize-Name $_) -notin ($staticJars | ForEach-Object { Normalize-Name $_ }) }
if ($staticAdd) { Write-Host "Bundled jars added:   $($staticAdd -join ', ')" -ForegroundColor Green }
if ($staticDel) { Write-Host "Bundled jars removed: $($staticDel -join ', ')" -ForegroundColor Red }

if ($DryRun) { Write-Host "`n(dry run - nothing changed)" -ForegroundColor Cyan; return }

# --- Mirror shared content folders from the instance ---
# Everything here is pack content every machine must have: scripts, fix
# datapacks, menu customization, fresh-install defaults, custom gun packs.
# /MIR means deletions in the instance propagate too.
$ContentDirs = @('global_packs', 'config\fancymenu', 'configureddefaults', 'defaultconfigs', 'emotes')
foreach ($d in $ContentDirs) {
    if (Test-Path "$Instance\$d") { robocopy "$Instance\$d" "$pack\$d" /MIR /NFL /NDL /NJH /NJS | Out-Null }
}
# KubeJS: ship everything except the local web-server config (it holds a
# per-machine auth token and shouldn't be shared).
if (Test-Path "$Instance\kubejs") { robocopy "$Instance\kubejs" "$pack\kubejs" /MIR /XF web_server.json /NFL /NDL /NJH /NJS | Out-Null }
# TACZ: ship custom gun packs only; the default pack self-extracts everywhere.
if (Test-Path "$Instance\tacz") { robocopy "$Instance\tacz" "$pack\tacz" /MIR /XD tacz_default_gun /XF .export-state.json /NFL /NDL /NJH /NJS | Out-Null }
# Shaderpacks: ship base zips only (top level); Euphoria Patcher generates the
# patched folders on each machine and errors loudly without its base zip.
if (Test-Path "$Instance\shaderpacks") { robocopy "$Instance\shaderpacks" "$pack\shaderpacks" *.zip /LEV:1 /PURGE /NFL /NDL /NJH /NJS | Out-Null }
$contentChanged = @(git -C $pack status --porcelain).Count -gt 0
if ($contentChanged) { Write-Host "Content folders: changes detected" -ForegroundColor Yellow }

if (-not ($toAdd -or $toUpdate -or $toRemove -or $cfRemove -or $staticAdd -or $staticDel -or $contentChanged)) {
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
foreach ($cf in $cfRemove) { Remove-Item -LiteralPath $cf.path -Force }
foreach ($f in $staticAdd) { Copy-Item -LiteralPath "$Instance\mods\$f" "$pack\mods\" -Force }
foreach ($f in $staticDel) { Remove-Item -LiteralPath "$pack\mods\$f" -Force }

# --- Re-tag sides from Modrinth project metadata ---
# Manual overrides win over Modrinth metadata. Keyed by Modrinth project id.
# lithostitched: Modrinth says server-only, but Terralith requires it on
# clients too - fresh client installs crash without it.
$SideOverrides = @{
    'XaDC71GB' = 'both'   # Lithostitched: Terralith requires it client-side
    'OfKzpbRU' = 'both'   # BaguetteLib: registers a mandatory network channel;
                          # server rejects clients that lack it
    'pJGcKPh1' = 'both'   # Corpse x Curios Compat: registers a synced
                          # data_component_type; registry sync rejects clients
}
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
    $sideById[$p.id] = if ($SideOverrides.ContainsKey($p.id)) { $SideOverrides[$p.id] }
                       elseif ($p.server_side -eq 'unsupported') { 'client' }
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
