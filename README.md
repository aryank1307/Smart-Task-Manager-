# Smart Task Manager

Full-stack task manager with auth, task CRUD, priorities, and deadlines, plus CI/CD auto-deploy to AWS EC2.

## Tech Stack
- Frontend: React (Vite + Nginx)
- Backend: Node.js + Express + JWT
- Database: MongoDB
- DevOps: GitHub -> Jenkins -> Docker -> AWS EC2

## Features
- Register / Login
- Create / Update / Delete tasks
- Set priority (`Low`, `Medium`, `High`)
- Set deadline
- Per-user protected task API

## Project Structure
- `frontend/` React app
- `backend/` Express API
- `docker-compose.yml` local stack (frontend + backend + MongoDB)
- `Jenkinsfile` CI/CD pipeline for EC2 deployment

## Run Locally (One Command)
```bash
docker compose up --build -d
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000/api/health`

Stop:
```bash
docker compose down
```

API smoke test:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

## Environment Files
- Backend template: `backend/.env.example`
- Frontend template: `frontend/.env.example`

Local backend defaults:
- `PORT=5000`
- `MONGO_URI=mongodb://mongo:27017/smart_task_manager`
- `JWT_SECRET=replace_with_strong_secret`
- `CLIENT_URL=http://localhost:3000`

## Jenkins CI/CD (Auto Deploy)
### Flow
1. Push code to GitHub.
2. GitHub webhook triggers Jenkins job.
3. Jenkins builds backend + frontend Docker images.
4. Jenkins pushes both images to Docker Hub.
5. Jenkins deploys containers on EC2 via SSH.

### Jenkins Credentials Required
- `dockerhub-creds` (Username/Password)
- `ec2-ssh-key` (SSH private key for EC2)
- `mongo-uri` (Secret text, production MongoDB URI)
- `jwt-secret` (Secret text, JWT secret)

### Update Jenkinsfile Values
No code edit required. Use Jenkins job parameters:
- `DOCKERHUB_USERNAME`
- `IMAGE_TAG`
- `EC2_HOST`
- `EC2_USER`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `DEPLOY_TO_EC2`

### EC2 Requirements
- Docker installed
- Security group open:
  - `80` (frontend)
  - `5000` (backend API)
  - `22` (SSH for Jenkins)

Optional EC2 bootstrap script:
```bash
bash deploy/ec2-bootstrap.sh
```

## One-Time Setup Commands
### 1) Push project to GitHub
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\push-to-github.ps1 -RemoteUrl "https://github.com/<owner>/<repo>.git"
```

### 2) Create GitHub webhook (optional via CLI)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-github-webhook.ps1 `
  -Owner "<owner>" `
  -Repo "<repo>" `
  -JenkinsWebhookUrl "http://<jenkins-host>/github-webhook/"
```

### 3) Jenkins configuration checklist
See:
- `scripts/jenkins-setup-checklist.md`

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
