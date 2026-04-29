param(
  [Parameter(Mandatory = $true)] [string]$RemoteUrl,
  [string]$Branch = 'main',
  [string]$CommitMessage = 'Initial Smart Task Manager setup'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.git')) {
  git init
}

git add .
$staged = git diff --cached --name-only
if ($staged) {
  git commit -m $CommitMessage
}

$existing = git remote 2>$null
if ($existing -notcontains 'origin') {
  git remote add origin $RemoteUrl
} else {
  git remote set-url origin $RemoteUrl
}

git branch -M $Branch
git push -u origin $Branch

Write-Host "Pushed to $RemoteUrl on branch $Branch"
