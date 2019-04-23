#!/bin/bash
echo "Starting dependency install script"

check_package_managers() {
    if [ "$(uname)" == "Darwin" ]; then
        if ! type "brew" > /dev/null; then
            echo "Brew is not present, installing"
            /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
        else
            echo "Brew is present, continue"
        fi
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        echo "Updating APT"
        sudo apt-get update
    fi
}

check_docker() {
    if ! type "docker" > /dev/null; then
        echo "Docker is not present, installing"
        if [ "$(uname)" == "Darwin" ]; then
            echo "Best way to install Docker is from the Docker website"
            echo "You are being redirected to https://hub.docker.com/editions/community/docker-ce-desktop-mac"
            echo "Once finished with the Docker installation, please run this script again"
            open "https://hub.docker.com/editions/community/docker-ce-desktop-mac"
            exit 0
        elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
            # Set up the docker repository
            sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
            sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
            # Install Docker CE
            sudo apt-get install docker-ce
        else
            echo "Unsupported platform"
            exit 1
        fi
    else
        echo "Docker is present, continue"
    fi
}

check_git() {
    if ! type "git" > /dev/null; then
        echo "Git is not present, installing"
        if [ "$(uname)" == "Darwin" ]; then
            brew install git
        elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
            apt-get 
        else
            echo "Unsupported platform"
            exit 1
        fi
    else
        echo "Git is present, continue"
    fi
}

check_einstore() {
    if ! [ -d ~/einstore/.git ]; then
        echo "Cloning Einstore"
        git clone https://github.com/Einstore/Einstore.git ~/einstore
        cd ~/einstore && make install-db
    else
        echo "Einstore exists, updating"
        cd ~/einstore && git pull && make update
    fi
}

check_package_managers
check_docker
check_git
check_einstore