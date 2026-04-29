# Smart Task Manager

Full-stack task manager with auth, task CRUD, priorities, deadlines, and CI/CD deployment to AWS EC2.

## Tech Stack
- Frontend: React (Vite + Nginx)
- Backend: Node.js + Express + JWT
- Database: MySQL
- DevOps: GitHub -> Jenkins -> Docker -> AWS EC2

## Features
- Register / Login
- Create / Update / Delete tasks
- Set priority (`Low`, `Medium`, `High`)
- Set deadline
- Protected task APIs per user

## Project Structure
- `frontend/` React app
- `backend/` Express API (MySQL)
- `docker-compose.yml` local stack (frontend + backend + MySQL)
- `Jenkinsfile` CI/CD pipeline for EC2 deployment

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

## Environment Files
- Backend template: `backend/.env.example`
- Frontend template: `frontend/.env.example`

Local backend defaults:
- `PORT=5000`
- `MYSQL_HOST=mysql`
- `MYSQL_PORT=3306`
- `MYSQL_USER=stm_user`
- `MYSQL_PASSWORD=stm_password`
- `MYSQL_DATABASE=smart_task_manager`
- `JWT_SECRET=replace_with_strong_secret`
- `CLIENT_URL=http://localhost:3000`

## Jenkins CI/CD (Auto Deploy)
### Flow
1. Push code to GitHub.
2. Jenkins pulls repo and builds backend + frontend images.
3. Jenkins pushes both images to Docker Hub.
4. Jenkins SSH deploys latest images to EC2.

### Jenkins Credentials Required
- `dockerhub-creds` (Username/Password)
- `ec2-ssh-key` (SSH Username with private key)
- `jwt-secret` (Secret text)
- `mysql-host` (Secret text, e.g. RDS endpoint)
- `mysql-user` (Secret text)
- `mysql-password` (Secret text)
- `mysql-database` (Secret text)

### Build Parameters
- `DOCKERHUB_USERNAME`
- `IMAGE_TAG`
- `EC2_HOST`
- `EC2_USER`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `DEPLOY_TO_EC2`

### EC2 Requirements
- Docker installed and running
- Security group open:
  - `22` (SSH)
  - `80` (frontend)
  - `5000` (backend API)
- Backend can reach your MySQL server (RDS or MySQL host) on port `3306`

Optional EC2 bootstrap:
```bash
bash deploy/ec2-bootstrap.sh
```

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
