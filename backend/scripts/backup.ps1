param([string]$BackupDirectory = ".\backups")
$ErrorActionPreference = "Stop"
if (-not $env:PGHOST -or -not $env:PGDATABASE -or -not $env:PGUSER) {
  throw "Set PGHOST, PGDATABASE, and PGUSER in this terminal first. Do not hard-code passwords in this script."
}
if ($env:PGDATABASE -ne "project_two_db") {
  $confirmation = Read-Host "Database is '$env:PGDATABASE', not project_two_db. Type the exact database name to continue"
  if ($confirmation -ne $env:PGDATABASE) { throw "Database name confirmation did not match." }
}
New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$file = Join-Path $BackupDirectory "project_two_$stamp.dump"
pg_dump --format=custom --no-owner --file="$file"
if ($LASTEXITCODE -ne 0) { Remove-Item $file -ErrorAction SilentlyContinue; throw "pg_dump failed." }
Write-Host "Backup created: $file"
Write-Host "Protect this file; it contains application data. Store encrypted and outside the Git repository."
