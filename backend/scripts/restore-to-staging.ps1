param([Parameter(Mandatory=$true)][string]$BackupFile,[Parameter(Mandatory=$true)][string]$StagingDatabase)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $BackupFile -PathType Leaf)) { throw "Backup file does not exist." }
if ($StagingDatabase -eq "project_two_db" -or $StagingDatabase -match "prod") { throw "Refusing to restore to the live/default database. Use a clearly named staging database." }
$confirm = Read-Host "This overwrites objects in staging database '$StagingDatabase'. Type RESTORE-STAGING to continue"
if ($confirm -ne "RESTORE-STAGING") { throw "Cancelled." }
pg_restore --clean --if-exists --no-owner --dbname="$StagingDatabase" "$BackupFile"
if ($LASTEXITCODE -ne 0) { throw "Restore failed. Inspect output and verify the staging database." }
Write-Host "Restore completed to staging database '$StagingDatabase'. Validate the application before any production recovery."
