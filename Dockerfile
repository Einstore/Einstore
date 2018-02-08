FROM swiftdocker/swift:4.0

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

RUN swift build --configuration release
RUN ln -s .build/x86_64-unknown-linux/release/Run ./boost


FROM swiftdocker/swift:4.0

COPY --from=0 /boost/.build/x86_64-unknown-linux/release/Run /app/boost

EXPOSE 8080
CMD /app/boost serve -configDir=./Config
