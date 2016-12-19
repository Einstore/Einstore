#!/usr/bin/env bash

if [[ $(id -u) -ne 0 ]] ; then echo "Please run as root ( sudo install-ubuntu.sh )" ; exit 1 ; fi

# Update all
apt-get update

# Curl
if hash curl 2>/dev/null; then
    echo "Curl is installed ✓"
else
    echo "Need to install Curl ..."
    sudo apt-get -y install curl
    echo "Curl installation complete ✓"
fi

# Java
if hash java 2>/dev/null; then
    echo "Java is installed ✓"
else
    echo "Need to install Java ..."
	sudo apt-get -y install default-jre default-jdk
    echo "Java installation complete ✓"
fi


# Ruby
if hash ruby 2>/dev/null; then
    echo "Ruby is installed ✓"
else
    echo "Need to install Ruby ..."
    sudo apt-get -y install ruby-full
    echo "Ruby installation complete ✓"
fi


# unzip
if hash unzip 2>/dev/null; then
    echo "unzip is installed ✓"
else
    echo "Need to install unzip ..."
    sudo apt-get -y install unzip
    echo "unzip installation complete ✓"
fi

# Swift
if hash swift 2>/dev/null; then
    echo "Swift is installed ✓"
else
    echo "Need to install Swift ..."    
	sudo curl -sL swift.vapor.sh/ubuntu | bash
	echo "📅 Version: `swift --version`";
	
    echo "Swift installation complete ✓"
fi


# Vapor
if hash vapor 2>/dev/null; then
    echo "Vapor is installed, updating ..."
    sudo vapor self update
    echo "Vapor is up to date ✓"
else
    echo "Need to install Vapor ..."
    sudo curl -sL toolbox.qutheory.io | sh
    echo "Vapor installation complete ✓"
fi


echo "Please reboot to finish installation!"




