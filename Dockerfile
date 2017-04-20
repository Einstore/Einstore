# Boost
FROM mangoweb/swift:latest

MAINTAINER Ondrej Rafaj "ondrej.rafaj@liveui.io"

# Update the system
RUN apt-get -y update

# Create working directory
CMD mkdir -R /Projects/Web/Boost
COPY ./ /Projects/Web/Boost



# Build and run Boost
#RUN cd /Projects/Web/Boost && swift build

#RUN mongo boost --eval "db.createUser( { user: \"boost\", pwd: \"boost\", roles: [ { role: \"readWrite\", db: \"boost\" } ] } )"

ENTRYPOINT cd /Projects/Web/Boost && ./run.sh

EXPOSE 80 443 8080