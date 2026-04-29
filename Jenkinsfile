pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'DOCKERHUB_USERNAME', defaultValue: 'yourdockerhubusername', description: 'Docker Hub username/namespace')
    string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Image tag to publish')
    string(name: 'EC2_HOST', defaultValue: 'your-ec2-public-ip', description: 'EC2 public IP or DNS')
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
            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
            docker push %DOCKERHUB_REPO_BACKEND%:%IMAGE_TAG%
            docker tag %DOCKERHUB_REPO_BACKEND%:%IMAGE_TAG% %DOCKERHUB_REPO_BACKEND%:latest
            docker push %DOCKERHUB_REPO_BACKEND%:latest
            docker push %DOCKERHUB_REPO_FRONTEND%:%IMAGE_TAG%
            docker tag %DOCKERHUB_REPO_FRONTEND%:%IMAGE_TAG% %DOCKERHUB_REPO_FRONTEND%:latest
            docker push %DOCKERHUB_REPO_FRONTEND%:latest
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
          string(credentialsId: 'mongo-uri', variable: 'MONGO_URI'),
          string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
          sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')
        ]) {
          powershell '''
            $ErrorActionPreference = "Stop"

            $mongoB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($env:MONGO_URI))
            $jwtB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($env:JWT_SECRET))

            $remote = @"
set -e
MONGO_URI=$(printf '%s' '$mongoB64' | base64 -d)
JWT_SECRET=$(printf '%s' '$jwtB64' | base64 -d)

docker pull $env:DOCKERHUB_REPO_BACKEND:latest
docker pull $env:DOCKERHUB_REPO_FRONTEND:latest
docker network create stm-net || true
docker rm -f $env:BACKEND_CONTAINER || true
docker rm -f $env:FRONTEND_CONTAINER || true

docker run -d --name $env:BACKEND_CONTAINER \
  --network stm-net \
  -p ${env:BACKEND_PORT}:5000 \
  --restart unless-stopped \
  -e PORT=5000 \
  -e MONGO_URI="$MONGO_URI" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e CLIENT_URL="http://$env:EC2_HOST" \
  $env:DOCKERHUB_REPO_BACKEND:latest

docker run -d --name $env:FRONTEND_CONTAINER \
  --network stm-net \
  -p ${env:FRONTEND_PORT}:80 \
  --restart unless-stopped \
  $env:DOCKERHUB_REPO_FRONTEND:latest
"@

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
