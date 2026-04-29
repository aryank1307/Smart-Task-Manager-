pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'DOCKERHUB_USERNAME', defaultValue: 'hellfire13', description: 'Docker Hub username/namespace')
    string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Image tag to publish')
    string(name: 'EC2_HOST', defaultValue: '15.206.70.62', description: 'EC2 public IP or DNS')
    string(name: 'EC2_USER', defaultValue: 'ec2-user', description: 'SSH user for EC2')
    string(name: 'BACKEND_PORT', defaultValue: '5000', description: 'Host port for backend API')
    string(name: 'FRONTEND_PORT', defaultValue: '80', description: 'Host port for frontend')
    booleanParam(name: 'DEPLOY_TO_EC2', defaultValue: true, description: 'Deploy to EC2 after push')
  }

  environment {
    BACKEND_CONTAINER = 'stm-backend'
    FRONTEND_CONTAINER = 'stm-frontend'
    DOCKERHUB_REPO_BACKEND = "${params.DOCKERHUB_USERNAME}/smart-task-manager-backend"
    DOCKERHUB_REPO_FRONTEND = "${params.DOCKERHUB_USERNAME}/smart-task-manager-frontend"
    FRONTEND_API_URL = "http://${params.EC2_HOST}:${params.BACKEND_PORT}/api"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Images') {
      steps {
        bat 'docker --version'
        bat "docker build -f backend/Dockerfile -t %DOCKERHUB_REPO_BACKEND%:%IMAGE_TAG% backend"
        bat "docker build --build-arg VITE_API_URL=%FRONTEND_API_URL% -f frontend/Dockerfile -t %DOCKERHUB_REPO_FRONTEND%:%IMAGE_TAG% frontend"
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          bat '''
            @echo off
            echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin
            if errorlevel 1 exit /b %errorlevel%
            docker push %DOCKERHUB_REPO_BACKEND%:%IMAGE_TAG%
            if errorlevel 1 exit /b %errorlevel%
            docker tag %DOCKERHUB_REPO_BACKEND%:%IMAGE_TAG% %DOCKERHUB_REPO_BACKEND%:latest
            if errorlevel 1 exit /b %errorlevel%
            docker push %DOCKERHUB_REPO_BACKEND%:latest
            if errorlevel 1 exit /b %errorlevel%
            docker push %DOCKERHUB_REPO_FRONTEND%:%IMAGE_TAG%
            if errorlevel 1 exit /b %errorlevel%
            docker tag %DOCKERHUB_REPO_FRONTEND%:%IMAGE_TAG% %DOCKERHUB_REPO_FRONTEND%:latest
            if errorlevel 1 exit /b %errorlevel%
            docker push %DOCKERHUB_REPO_FRONTEND%:latest
            if errorlevel 1 exit /b %errorlevel%
            docker logout
          '''
        }
      }
    }

    stage('Deploy to EC2') {
      when {
        expression { return params.DEPLOY_TO_EC2 }
      }
      steps {
        withCredentials([
          string(credentialsId: 'mysql-host', variable: 'MYSQL_HOST'),
          string(credentialsId: 'mysql-user', variable: 'MYSQL_USER'),
          string(credentialsId: 'mysql-password', variable: 'MYSQL_PASSWORD'),
          string(credentialsId: 'mysql-database', variable: 'MYSQL_DATABASE'),
          string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
          sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')
        ]) {
          powershell '''
            $ErrorActionPreference = "Stop"

            $mysqlHostB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($env:MYSQL_HOST))
            $mysqlUserB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($env:MYSQL_USER))
            $mysqlPasswordB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($env:MYSQL_PASSWORD))
            $mysqlDbB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($env:MYSQL_DATABASE))
            $jwtB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($env:JWT_SECRET))

            $remote = @'
set -e
if ! command -v docker &> /dev/null
then
    echo "Docker not found. Installing..."
    sudo yum update -y || true
    sudo yum install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ec2-user || true
fi

sudo systemctl start docker || true

MYSQL_HOST=$(printf '%s' '__MYSQL_HOST_B64__' | base64 -d)
MYSQL_USER=$(printf '%s' '__MYSQL_USER_B64__' | base64 -d)
MYSQL_PASSWORD=$(printf '%s' '__MYSQL_PASSWORD_B64__' | base64 -d)
MYSQL_DATABASE=$(printf '%s' '__MYSQL_DB_B64__' | base64 -d)
JWT_SECRET=$(printf '%s' '__JWT_B64__' | base64 -d)

sudo docker pull __REPO_BACKEND__:latest
sudo docker pull __REPO_FRONTEND__:latest
sudo docker network create stm-net || true
sudo docker rm -f __BACKEND_CONTAINER__ || true
sudo docker rm -f __FRONTEND_CONTAINER__ || true

sudo docker run -d --name __BACKEND_CONTAINER__ \
  --network stm-net \
  -p __BACKEND_PORT__:5000 \
  --restart unless-stopped \
  -e PORT=5000 \
  -e MYSQL_HOST="$MYSQL_HOST" \
  -e MYSQL_PORT=3306 \
  -e MYSQL_USER="$MYSQL_USER" \
  -e MYSQL_PASSWORD="$MYSQL_PASSWORD" \
  -e MYSQL_DATABASE="$MYSQL_DATABASE" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e CLIENT_URL="http://__EC2_HOST__" \
  __REPO_BACKEND__:latest

sudo docker run -d --name __FRONTEND_CONTAINER__ \
  --network stm-net \
  -p __FRONTEND_PORT__:80 \
  --restart unless-stopped \
  __REPO_FRONTEND__:latest
'@

            $remote = $remote.Replace('__MYSQL_HOST_B64__', $mysqlHostB64)
            $remote = $remote.Replace('__MYSQL_USER_B64__', $mysqlUserB64)
            $remote = $remote.Replace('__MYSQL_PASSWORD_B64__', $mysqlPasswordB64)
            $remote = $remote.Replace('__MYSQL_DB_B64__', $mysqlDbB64)
            $remote = $remote.Replace('__JWT_B64__', $jwtB64)
            $remote = $remote.Replace('__REPO_BACKEND__', $env:DOCKERHUB_REPO_BACKEND)
            $remote = $remote.Replace('__REPO_FRONTEND__', $env:DOCKERHUB_REPO_FRONTEND)
            $remote = $remote.Replace('__BACKEND_CONTAINER__', $env:BACKEND_CONTAINER)
            $remote = $remote.Replace('__FRONTEND_CONTAINER__', $env:FRONTEND_CONTAINER)
            $remote = $remote.Replace('__BACKEND_PORT__', $env:BACKEND_PORT)
            $remote = $remote.Replace('__FRONTEND_PORT__', $env:FRONTEND_PORT)
            $remote = $remote.Replace('__EC2_HOST__', $env:EC2_HOST)

            $acl = Get-Acl $env:SSH_KEY
            $acl.SetAccessRuleProtection($true, $false)
            $acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) | Out-Null }
            $rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, "Read", "Allow")
            $acl.AddAccessRule($rule)
            Set-Acl -Path $env:SSH_KEY -AclObject $acl

            ssh -o StrictHostKeyChecking=no -i $env:SSH_KEY "$env:EC2_USER@$env:EC2_HOST" $remote
          '''
        }
      }
    }
  }

  post {
    success {
      echo 'Deployment complete. App should be available on EC2.'
    }
    failure {
      echo 'Pipeline failed. Check Jenkins logs for failed stage.'
    }
  }
}
