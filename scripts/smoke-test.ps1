$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get
$register = @{ name='demo'; email='demo@example.com'; password='Pass@123' } | ConvertTo-Json
try { Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method Post -ContentType 'application/json' -Body $register | Out-Null } catch {}
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -ContentType 'application/json' -Body (@{ email='demo@example.com'; password='Pass@123' } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.token)" }
$task = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method Post -Headers $headers -ContentType 'application/json' -Body (@{ title='Smoke Test'; description='pipeline verification'; priority='High' } | ConvertTo-Json)
$tasks = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method Get -Headers $headers

[PSCustomObject]@{
  health = $health.status
  login = $login.user.email
  created_task = $task.title
  task_count = $tasks.Count
} | Format-List
