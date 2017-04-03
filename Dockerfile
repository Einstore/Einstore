# Boost
FROM mangoweb/swift:mongodb

MAINTAINER Ondrej Rafaj "ondrej.rafaj@liveui.io"

# Update the system
RUN apt-get -y update

# Create working directory
CMD mkdir -R /Projects/Web/Boost
COPY ./ /Projects/Web/Boost

CMD mongod

# Build and run Boost
RUN cd /Projects/Web/Boost && swift build


ENTRYPOINT mongod && /bin/bash
ENTRYPOINT ls && pwd && echo ":)"
ENTRYPOINT cd /Projects/Web/Boost && vapor run serve && /bin/bash

EXPOSE 80 443 8080