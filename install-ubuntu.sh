if [[ $(id -u) -ne 0 ]] ; then echo "Please run as root ( sudo install-ubuntu.sh )" ; exit 1 ; fi

# Update all
apt-get update


# Swift
if hash swift 2>/dev/null; then
    echo "Swift is installed ✓"
else
    echo "Need to install Swift ..."
    
	# Determine OS
	UNAME=`uname`;
	if [[ $UNAME == "Darwin" ]];
	then
	    OS="macos";
	else
	    if [[ $UNAME == "Linux" ]];
	    then
	        UBUNTU_RELEASE=`lsb_release -a 2>/dev/null`;
	        if [[ $UBUNTU_RELEASE == *"16.04"* ]];
	        then
	            OS="ubuntu1604";
	        else
	            OS="ubuntu1510";
	        fi
	    else
	        echo "Unsupported Operating System: $UNAME";
	    fi
	fi
	echo "🖥 Operating System: $OS";
	
	if [[ $OS != "macos" ]];
	then
	    echo "📚 Installing Dependencies"
	    sudo apt-get install -y clang libicu-dev uuid-dev
	
	    echo "🐦 Installing Swift";
	    if [[ $OS == "ubuntu1510" ]];
	    then
	        SWIFTFILE="swift-$VERSION-RELEASE-ubuntu15.10";    
	    else
	        SWIFTFILE="swift-$VERSION-RELEASE-ubuntu14.04";
	    fi
	    wget https://swift.org/builds/swift-$VERSION-release/$OS/swift-$VERSION-RELEASE/$SWIFTFILE.tar.gz
	    tar -zxf $SWIFTFILE.tar.gz
	    export PATH=$PWD/$SWIFTFILE/usr/bin:"${PATH}"
	fi
	
	echo "📅 Version: `swift --version`";
	
    echo "Swift installation complete ✓"
fi

exit



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
