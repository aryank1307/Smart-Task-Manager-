pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  triggers {
    githubPush()
  }

  parameters {
    string(name: 'DOCKERHUB_USERNAME', defaultValue: 'yourdockerhubusername', description: 'Docker Hub username/namespace')
    string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Image tag to publish (example: latest, build-42, v1)')
    string(name: 'EC2_HOST', defaultValue: 'your-ec2-public-ip', description: 'EC2 public IP or DNS')
    string(name: 'EC2_USER', defaultValue: 'ec2-user', description: 'SSH user for EC2')
    string(name: 'BACKEND_PORT', defaultValue: '5000', description: 'Host port for backend API')
    string(name: 'FRONTEND_PORT', defaultValue: '80', description: 'Host port for frontend')
    booleanParam(name: 'DEPLOY_TO_EC2', defaultValue: true, description: 'Deploy to EC2 after push')
  }

  environment {
    APP_NAME = 'smart-task-manager'
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
        sh 'docker --version'
        script {
          docker.build("${DOCKERHUB_REPO_BACKEND}:${params.IMAGE_TAG}", "-f backend/Dockerfile backend")
          docker.build(
            "${DOCKERHUB_REPO_FRONTEND}:${params.IMAGE_TAG}",
            "--build-arg VITE_API_URL=${FRONTEND_API_URL} -f frontend/Dockerfile frontend"
          )
        }
      }
    }

    stage('Push Images') {
      steps {
        script {
          docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
            docker.image("${DOCKERHUB_REPO_BACKEND}:${params.IMAGE_TAG}").push()
            docker.image("${DOCKERHUB_REPO_BACKEND}:${params.IMAGE_TAG}").push('latest')
            docker.image("${DOCKERHUB_REPO_FRONTEND}:${params.IMAGE_TAG}").push()
            docker.image("${DOCKERHUB_REPO_FRONTEND}:${params.IMAGE_TAG}").push('latest')
          }
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
          string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET')
        ]) {
          sshagent(credentials: ['ec2-ssh-key']) {
            sh """
              ssh -o StrictHostKeyChecking=no ${params.EC2_USER}@${params.EC2_HOST} '
                set -e
                docker pull ${DOCKERHUB_REPO_BACKEND}:latest
                docker pull ${DOCKERHUB_REPO_FRONTEND}:latest

                docker network create stm-net || true

                docker rm -f ${BACKEND_CONTAINER} || true
                docker rm -f ${FRONTEND_CONTAINER} || true

                docker run -d --name ${BACKEND_CONTAINER} \\
                  --network stm-net \\
                  -p ${params.BACKEND_PORT}:5000 \\
                  --restart unless-stopped \\
                  -e PORT=5000 \\
                  -e MONGO_URI=\"${MONGO_URI}\" \\
                  -e JWT_SECRET=\"${JWT_SECRET}\" \\
                  -e CLIENT_URL=\"http://${params.EC2_HOST}\" \\
                  ${DOCKERHUB_REPO_BACKEND}:latest

                docker run -d --name ${FRONTEND_CONTAINER} \\
                  --network stm-net \\
                  -p ${params.FRONTEND_PORT}:80 \\
                  --restart unless-stopped \\
                  ${DOCKERHUB_REPO_FRONTEND}:latest
              '
            """
          }
        }
      }
    }
  }

  post {
    success {
      echo 'Deployment complete. App should be available on EC2.'
    }
    failure {
      echo 'Pipeline failed. Check Jenkins stage logs.'
    }
  }
}
