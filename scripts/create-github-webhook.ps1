param(
  [Parameter(Mandatory = $true)] [string]$Owner,
  [Parameter(Mandatory = $true)] [string]$Repo,
  [Parameter(Mandatory = $true)] [string]$JenkinsWebhookUrl,
  [string]$Secret = ''
)

$ErrorActionPreference = 'Stop'

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  throw 'GitHub CLI (gh) is not installed or not on PATH.'
}

$payload = @{
  name = 'web'
  active = $true
  events = @('push')
  config = @{
    url = $JenkinsWebhookUrl
    content_type = 'json'
    insecure_ssl = '0'
  }
}

if ($Secret -ne '') {
  $payload.config.secret = $Secret
}

$json = $payload | ConvertTo-Json -Depth 6 -Compress
$endpoint = "repos/$Owner/$Repo/hooks"

$tmp = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tmp -Value $json -NoNewline
$null = gh api $endpoint --method POST --input $tmp
Remove-Item $tmp -Force
Write-Host "Webhook created for $Owner/$Repo -> $JenkinsWebhookUrl"
