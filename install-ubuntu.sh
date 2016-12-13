if [[ $(id -u) -ne 0 ]] ; then echo "Please run as root ( sudo install-ubuntu.sh )" ; exit 1 ; fi

# Update all
apt-get update


# Swift
if hash swift 2>/dev/null; then
    echo "Swift is installed ✓"
else
    echo "Need to install Swift ..."
    apt-get -y install clang libicu-dev binutils git
    mkdir ./tmp/
    cd ./tmp/
    wget https://swift.org/builds/swift-3.0.1-release/ubuntu1604/swift-3.0.1-RELEASE/swift-3.0.1-RELEASE-ubuntu16.04.tar.gz
    tar -xvf ./swift-3.0.1-RELEASE-ubuntu16.04.tar.gz
    mkdir /opt/swift/swift-3.0
    mv ./swift-3.0.1-RELEASE-ubuntu16.04/usr/ /opt/swift/swift-3.0
    # Follow the rest on http://blog.robkerr.com/install-swift-3-0-on-ubuntu-linux-16-04-lts/
    cd ../
    echo "Swift installation complete ✓"
fi


# Vapor
if hash vapor 2>/dev/null; then
    echo "Vapor is installed, updating ..."
    vapor self update
    echo "Vapor is up to date ✓"
else
    echo "Need to install Vapor ..."
    curl -sL toolbox.qutheory.io | sh
    echo "Vapor installation complete ✓"
fi


# Java
if hash java 2>/dev/null; then
    echo "Java is installed ✓"
else
    echo "Need to install Java ..."
    apt-get -y install openjdk-6-jre-headless
    echo "Java installation complete ✓"
fi


# Ruby
if hash ruby 2>/dev/null; then
    echo "Ruby is installed ✓"
else
    echo "Need to install Ruby ..."
    apt-get -y install ruby-full
    echo "Ruby installation complete ✓"
fi


# unzip
if hash unzip 2>/dev/null; then
    echo "unzip is installed ✓"
else
    echo "Need to install unzip ..."
    apt-get -y install unzip
    echo "unzip installation complete ✓"
fi


# CFPropertyList
if hash CFPropertyList 2>/dev/null; then
    echo "CFPropertyList is installed ✓"
else
    echo "Need to install CFPropertyList ..."
    gem install CFPropertyList
    echo "CFPropertyList installation complete ✓"
fi