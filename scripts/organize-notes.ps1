# Move notes from src/content/notes/*.md into one folder per app.
# Folder name = the `app:` value in the frontmatter; notes without `app` go to portal.
# Tracked files are moved with `git mv` so history is kept.
#
# Preview:  powershell -File scripts/organize-notes.ps1 -WhatIf
# Run:      powershell -File scripts/organize-notes.ps1
#
# (ASCII only on purpose: Windows PowerShell 5.1 misreads UTF-8 files without a BOM.)

param([switch]$WhatIf)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$notes = Join-Path $root 'src/content/notes'

Push-Location $root
try {
  $files = Get-ChildItem -Path $notes -Filter *.md -File
  if (-not $files) { Write-Host 'Nothing to move.'; return }

  foreach ($file in $files) {
    $match = Select-String -Path $file.FullName -Pattern '^app:\s*(\S+)\s*$' -List -Encoding utf8
    $folder = if ($match) { $match.Matches[0].Groups[1].Value } else { 'portal' }

    $targetDir = Join-Path $notes $folder
    $target = Join-Path $targetDir $file.Name
    if (Test-Path $target) { throw "Already exists: $target" }

    Write-Host ("{0,-18} <- {1}" -f $folder, $file.Name)
    if ($WhatIf) { continue }

    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    # `git ls-files` prints nothing (and no error) for an untracked file.
    $tracked = git ls-files -- $file.FullName
    if ($tracked) { git mv -- $file.FullName $target } else { Move-Item -LiteralPath $file.FullName -Destination $target }
  }

  if (-not $WhatIf) {
    Write-Host ''
    Write-Host 'Result:'
    Get-ChildItem -Path $notes -Directory | ForEach-Object {
      Write-Host ("{0,-18} {1}" -f $_.Name, (Get-ChildItem $_.FullName -Filter *.md).Count)
    }
    Write-Host ''
    Write-Host 'Next: run "pnpm run build", then commit.'
  }
}
finally { Pop-Location }
