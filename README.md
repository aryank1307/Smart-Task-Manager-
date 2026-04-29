# Smart Task Manager

Full-stack task manager with authentication, task CRUD, priorities, deadlines, and automated deployment to AWS EC2.

## Tech Stack
- Frontend: React (Vite + Nginx)
- Backend: Node.js + Express + JWT
- Database: MongoDB
- DevOps: GitHub -> GitHub Actions -> Docker Hub -> AWS EC2

## Features
- Register / Login
- Create / Update / Delete tasks
- Set priority (`Low`, `Medium`, `High`)
- Set deadline
- Per-user protected task APIs

## Project Structure
- `frontend/` React app
- `backend/` Express API
- `docker-compose.yml` local stack
- `.github/workflows/deploy.yml` CI/CD pipeline

## Local Run
```bash
docker compose up --build -d
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/api/health`

Stop:
```bash
docker compose down
```

Smoke test:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

## Environment Templates
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`

## GitHub Actions Deployment
Workflow file:
- `.github/workflows/deploy.yml`

Trigger:
- Push to `main` branch
- Manual run from GitHub Actions tab (`workflow_dispatch`)

What pipeline does:
1. Build backend Docker image
2. Build frontend Docker image
3. Push both images to Docker Hub
4. SSH into EC2 and redeploy containers

## GitHub Secrets Required
Add in GitHub repo: `Settings -> Secrets and variables -> Actions -> New repository secret`

- `DOCKERHUB_USERNAME` (example: `aryank1307`)
- `DOCKERHUB_TOKEN` (Docker Hub access token, not password)
- `EC2_HOST` (public IP or DNS)
- `EC2_USER` (example: `ec2-user` or `ubuntu`)
- `EC2_SSH_KEY` (private key content used to SSH into EC2)
- `MONGO_URI` (production MongoDB URI, Atlas or RDS alternative layer)
- `JWT_SECRET` (strong random secret)
- `BACKEND_PORT` (example: `5000`)
- `FRONTEND_PORT` (example: `80`)
- `FRONTEND_API_URL` (example: `http://<EC2_HOST>:5000/api`)
- `FRONTEND_BASE_URL` (example: `http://<EC2_HOST>`)

## EC2 Prerequisites
- Docker installed and running
- Open inbound ports in Security Group:
  - `22` SSH
  - `80` frontend
  - `5000` backend API
- SSH key pair configured (`EC2_SSH_KEY` must match authorized public key on EC2)

Optional EC2 bootstrap:
```bash
bash deploy/ec2-bootstrap.sh
```

## Push Project
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\push-to-github.ps1 -RemoteUrl "https://github.com/aryank1307/Smart-Task-Manager-.git"
```

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
