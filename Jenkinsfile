pipeline {
  agent any
  environment {
    REGISTRY_AUTH = credentials('ucc-registry-unchained')
    DOCKER_BUILDKIT = 0
    DOTENV_PATH = credentials('unchained-dotenv')
    kitchensink = ''
    docs = ''
  }
  tools { dockerTool "docker" }
  stages {
    stage('Test') {
      steps {
        script {
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
    stage('Build') {
      parallel {
        stage('Example: Kitchensink') {
          stages {
            stage('Building') {
              steps{
                script {
                  kitchensink = docker.build("registry.ucc.dev/unchained/kitchensink","-f ./examples/kitchensink/Dockerfile ./examples/kitchensink")
                }
              }
            }
            stage('Pushing to Registry') {
              steps {
                script {
                  kitchensink.push("${GIT_BRANCH}-latest")
                }
              }
            }
          }
        }
        stage('Documentation') {
          stages {
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
          }
        }
      }
    }
    stage('Deploy to Test') {
      when { branch 'develop' }
      steps {
        script {
          kitchensink.push("next")
          docs.push("next")
        }
      }
    }
    stage('Deploy to Stage') {
      when { branch 'master' }
      steps {
        script {
          kitchensink.push("latest")
          docs.push("latest")
        }
      }
    }
    stage('Deploy to Unchained Cloud') {
      when { buildingTag() }
      steps {
        script {
          kitchensink.push("stable")
          docs.push("stable")
        }
      }
    }
  }
}
