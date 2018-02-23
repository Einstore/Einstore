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

RUN swift build --configuration debug
RUN ln -s .build/x86_64-unknown-linux/debug/Run ./boost


FROM mangoweb/swift:4.1-alpha

COPY --from=0 /boost/.build/x86_64-unknown-linux/debug/Run /app/boost

EXPOSE 8080
CMD /app/boost serve --hostname 0.0.0.0
