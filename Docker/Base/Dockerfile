FROM swift:4.2

RUN \
    apt-get update && \
    apt-get install -y python python-dev python-pip python-virtualenv unzip libgd-dev openssl libssl-dev libc6-dev-i386 lib32z1 && \
    rm -rf /var/lib/apt/lists/*

RUN \
	apt-get update && \
    apt-get install -y software-properties-common python-software-properties && \
    add-apt-repository ppa:openjdk-r/ppa && \
    apt-get update && \
    apt-get install -y openjdk-7-jdk && \
    rm -rf /var/lib/apt/lists/*
    
RUN apt-get update && apt-get install -y aapt

ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64
