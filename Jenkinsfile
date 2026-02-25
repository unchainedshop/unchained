pipeline {
  agent any
  environment {
    REGISTRY_AUTH = credentials('ucc-registry-unchained')
    DOCKER_BUILDKIT = 0
    DOTENV_PATH = credentials('unchained-dotenv')
    docs = ''
  }
  tools { dockerTool "docker" }
  stages {
    stage('Test') {
      steps {
        script {
          sh 'touch ./env && chmod 666 ./env'
          sh 'cp ${DOTENV_PATH} ./env'
          docker.build("ci:latest")
          sh 'docker run ci:latest npm run lint'
          sh 'docker run -t ci:latest sh -c "npm run test || :"'
        }
      }
    }
    stage('Login to Registry') {
      steps {
        script {
          sh 'docker login -u ${REGISTRY_AUTH_USR} -p ${REGISTRY_AUTH_PSW} registry.ucc.dev'
        }
      }
    }
    stage('Building') {
      steps{
        script {
          docs = docker.build("registry.ucc.dev/unchained/docs",'-f ./docs/Dockerfile ./docs')
        }
      }
    }
    stage('Pushing to Registry') {
      steps {
        script {
          docs.push("${GIT_BRANCH}-latest")
        }
      }
    }
    stage('Deploy to Test') {
      when { branch 'develop' }
      steps {
        script {
          docs.push("next")
        }
      }
    }
    stage('Deploy to Stage') {
      when { branch 'master' }
      steps {
        script {
          docs.push("latest")
        }
      }
    }
    stage('Deploy to Unchained Cloud') {
      when { buildingTag() }
      steps {
        script {
          docs.push("stable")
        }
      }
    }
  }
}
