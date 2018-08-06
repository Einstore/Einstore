FROM liveui/boost-base:1.1.1

WORKDIR /boost

ADD Public ./Public
ADD Resources ./Resources
ADD Sources ./Sources
ADD Tests ./Tests
ADD Package.swift ./
ADD Package.resolved ./

RUN swift build --configuration debug
RUN ln -s .build/x86_64-unknown-linux/debug/Run ./boost

COPY wait-for-it.sh .

EXPOSE 8080
CMD ./boost serve --hostname 0.0.0.0
