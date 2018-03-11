FROM mangoweb/swift:4.1-alpha

WORKDIR /boost

ADD Public ./Public
ADD Boost.xcodeproj ./Boost.xcodeproj
ADD Boost.xcworkspace ./Boost.xcworkspace
ADD Other ./Other
ADD Public ./Public
ADD Resources ./Resources
ADD scripts ./scripts
ADD Sources ./Sources
ADD Tests ./Tests
ADD Package.swift Package.resolved ./

RUN \
    apt-get update && \
    apt-get install -y python python-dev python-pip python-virtualenv && \
    rm -rf /var/lib/apt/lists/*

RUN \
    apt-get update && \
    apt-get install -y openjdk-8-jdk && \
    rm -rf /var/lib/apt/lists/*
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

RUN swift build --configuration debug
RUN ln -s .build/x86_64-unknown-linux/debug/Run ./boost

COPY --from=0 /boost/.build/x86_64-unknown-linux/debug/Run /app/boost

EXPOSE 8080
CMD /app/boost serve --hostname 0.0.0.0
