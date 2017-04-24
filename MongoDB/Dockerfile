FROM mongo:3.4

MAINTAINER Ondrej Rafaj "ondrej.rafaj@liveui.io"


COPY setup.sh /src/
RUN mongod & PID=$! && sleep 5 && bash /src/setup.sh && kill $PID
