# Boost
## Mobile enterprise distribution platform written in Swift


# Installation

Install [Docker](https://www.docker.com) 
Run `./docker_build.sh`
Run `docker-compose up`



### Following guide is obsolete as we'll be using Docker instead!!!!!!!!!!!!!!!!!!!

* Install Swift 3 on your machine ([macOS or Ubuntu](https://swift.org/download/#releases))
* Instal Vapor
    * [macOS](https://vapor.github.io/documentation/getting-started/install-swift-3-macos.html)
	 * [Ubuntu](https://vapor.github.io/documentation/getting-started/install-swift-3-ubuntu.html)
* Install [MongoDB](https://www.mongodb.com/download-center#community)
* Install java
* Install unzip
* Install ruby

* Clone repo
* Don't forget to initialize and clone all git submodules
```
git submodule update --init --recursive
```
More info on submodules: http://stackoverflow.com/questions/1030169/easy-way-pull-latest-of-all-submodules

* Setup access to your MongoDB as per Config/mongo.json or create your own configuration
* Create a MongoDB database (Boost?)


# Tools
[Toad](https://itunes.apple.com/gb/app/toad/id747961939?mt=12) is a nice GUI client for MongoDB for mac

## 📖 Vapor Documentation

Visit the Vapor web framework's [documentation](http://docs.vapor.codes) for instructions on how to use this package.

## 🔧 Compatibility

This package has been tested on macOS and should work on Ubuntu too :)
