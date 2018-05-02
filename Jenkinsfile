pipeline {
  agent any
  options {
    timeout(time: 15, unit: 'MINUTES')
  }

  stages {
    stage('Build') {
      when {
        anyOf {
          branch 'master'
        }
      }
      steps {
        script {
          mgw.inDocker('liveui/boost-base:1.0') {
            sh 'swift build --configuration debug'
          }
        }
      }
    }
  }
}
