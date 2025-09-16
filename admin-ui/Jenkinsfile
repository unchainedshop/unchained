pipeline {
  agent {
    label "docker-agent"
  }
  environment {
    REGISTRY_AUTH = credentials('eec0f0c2-9b9d-4b26-8da5-58222499d901')
    DOTENV_PATH = credentials('unchained-dotenv')
    adminui = ''
  }
  tools { dockerTool "docker" }
  stages {
    stage('Login to Registry') {
      steps {
        script {
          sh 'docker login -u ${REGISTRY_AUTH_USR} -p ${REGISTRY_AUTH_PSW} registry.ucc.dev'
        }
      }
    }
    stage('Build') {
      stages {
        stage('Building') {
          steps{
            script {
              adminui = docker.build("registry.ucc.dev/unchained/adminui:$GIT_BRANCH-$GIT_COMMIT","-f ./Dockerfile .")
            }
          }
        }
        stage('Pushing to Registry') {
          steps {
            script {
              adminui.push("${GIT_BRANCH}-latest")
            }
          }
        }
      }
    }
    stage('Deploy Next') {
      when { branch 'develop' }
      steps {
        script {
          adminui.push("next")
        }
      }
    }
    stage('Deploy Major Version') {
      when { anyOf { branch 'master'; branch 'v?.x' } }
      steps {
        script {
          def packageJson = readJSON file: './package.json'
          def packageVersion = packageJson.version
          def versionChunks = packageVersion.split(/\./)
          def majorVersion = versionChunks[0]
          def minorVersion = versionChunks[1]
          def patchVersion = versionChunks[2]

          adminui.push("v$majorVersion.$minorVersion.$patchVersion") // vN.0.0
          adminui.push("v$majorVersion.$minorVersion") // vN.0
          adminui.push("v$majorVersion") // vN
        }
      }
    }
    stage('Deploy Minor Version') {
      when { branch 'v?.*.x' }
      steps {
        script {
          def packageJson = readJSON file: './package.json'
          def packageVersion = packageJson.version
          def versionChunks = packageVersion.split(/\./)
          def majorVersion = versionChunks[0]
          def minorVersion = versionChunks[1]
          def patchVersion = versionChunks[2]

          adminui.push("v$majorVersion.$minorVersion.$patchVersion") // vN.0.0
          adminui.push("v$majorVersion.$minorVersion") // vN.0
        }
      }
    }
    stage('Deploy Explicit Version') {
      when { buildingTag() }
      steps {
        script {
          def packageJson = readJSON file: './package.json'
          def packageVersion = packageJson.version

          adminui.push("v$packageVersion")
        }
      }
    }
  }
}
