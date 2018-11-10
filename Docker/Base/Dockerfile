FROM swift:4.2

RUN \
    apt-get update && \
    apt-get install -y python python-dev python-pip python-virtualenv unzip libgd-dev openssl libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN \
    apt-get update && \
    apt-get install -y software-properties-common python-software-properties && \
    add-apt-repository ppa:openjdk-r/ppa && \
    apt-get update && \
    apt-get install -y openjdk-7-jdk && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64
