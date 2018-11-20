FROM liveui/boost-base:1.2.0

WORKDIR /boost

ADD Public ./Public
ADD Resources ./Resources
ADD Sources ./Sources
ADD Tests ./Tests
ADD Package.swift ./
ADD Package.resolved ./

RUN swift build --configuration debug
RUN ln -s .build/x86_64-unknown-linux/debug/Run ./boost

COPY ./scripts/wait-for-it.sh .

EXPOSE 8080
CMD echo "build: Thu Aug 9 15:53:26 CEST 2018" && ./boost serve --hostname 0.0.0.0
