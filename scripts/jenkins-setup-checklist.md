# Jenkins Setup Checklist

## 1) Create Jenkins Pipeline Job
- New Item -> Pipeline
- Definition: `Pipeline script from SCM`
- SCM: Git
- Repository URL: your GitHub repo URL
- Branch Specifier: `*/main`
- Script Path: `Jenkinsfile`
- Save

## 2) Required Jenkins Plugins
- Docker Pipeline
- SSH Agent
- Credentials Binding
- Git + GitHub Integration

## 3) Add Credentials
- `dockerhub-creds` (Username with password)
- `ec2-ssh-key` (SSH Username with private key)
- `mongo-uri` (Secret text)
- `jwt-secret` (Secret text)

## 4) Job Parameters to Fill at First Run
- `DOCKERHUB_USERNAME`
- `IMAGE_TAG`
- `EC2_HOST`
- `EC2_USER`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `DEPLOY_TO_EC2`

## 5) GitHub Webhook
- URL: `http://<JENKINS_HOST>/github-webhook/`
- Content type: `application/json`
- Event: `Just the push event`

## 6) EC2 Prerequisites
- Docker installed and running
- Ports open in Security Group: `22`, `80`, `5000`
- Jenkins SSH key authorized in `~/.ssh/authorized_keys`

## 7) Validate
- Push code to `main`
- Confirm Jenkins auto-trigger
- Confirm images pushed to Docker Hub
- Confirm EC2 containers running:
  - `docker ps`
  - `curl http://<EC2_HOST>:5000/api/health`
  - open `http://<EC2_HOST>/`
