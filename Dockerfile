# Boost

FROM ibmcom/swift-ubuntu:latest
MAINTAINER Ondrej Rafaj "ondrej.rafaj@liveui.io"

# Update the system
RUN apt-get -y update

# Install MongoBD
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
RUN echo "deb http://repo.mongodb.org/apt/ubuntu $(cat /etc/lsb-release | grep DISTRIB_CODENAME | cut -d= -f2)/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
RUN apt-get -y update && apt-get install -y mongodb-org
CMD mkdir /data/db
VOLUME /data/db

# Install system dependencies
#RUN apt-get -y install openssl
#RUN apt-get -y install curl
#RUN apt-get -y install default-jre default-jdk
#RUN apt-get -y install ruby-full
#RUN apt-get -y install unzip

# Instal Vapor Toolkit
#RUN curl -sL check.vapor.sh | bash
#RUN curl -sL toolbox.vapor.sh | bash
#RUN vapor self update

# Create working directory
#CMD mkdir -R /Projects/Web/Boost
#COPY ./ /Projects/Web/Boost

# Build and run LiveUI
#RUN cd /Projects/Web/Boost && swift build

#CMD mongod

#ENTRYPOINT mongod && /bin/bash
#ENTRYPOINT ls && pwd && echo ":)"
#ENTRYPOINT cd /Projects/Web/Boost && vapor run serve && /bin/bash

EXPOSE 80 443 8080