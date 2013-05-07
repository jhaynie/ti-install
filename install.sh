#!/bin/sh

# A word about this shell script:
#
# It must work everywhere, including on systems that lack
# a /bin/bash, map 'sh' to ksh, ksh97, bash, ash, or zsh,
# and potentially have either a posix shell or bourne
# shell living at /bin/sh.
#
# See this helpful document on writing portable shell scripts:
# http://www.gnu.org/s/hello/manual/autoconf/Portable-Shell.html
#
# The only shell it won't ever work on is cmd.exe.
#
# This script was adapted from the npm install.sh script

#if [ "x$0" = "xsh" ]; then
  # run as curl | sh
  # on some systems, you can just do cat>npm-install.sh
  # which is a bit cuter.  But on others, &1 is already closed,
  # so catting to another script file won't do anything.
  #curl -s https://npmjs.org/install.sh > npm-install-$$.sh
  #sh npm-install-$$.sh
  #ret=$?
  #rm npm-install-$$.sh
  #exit $ret
#fi


txtund=$(tput sgr 0 1)          # Underline
txtbld=$(tput bold)             # Bold
bldgry=${txtbld}$(tput setaf 0) #  grey
bldred=${txtbld}$(tput setaf 1) #  red
bldgrn=${txtbld}$(tput setaf 2) #  green
bldblu=${txtbld}$(tput setaf 4) #  blue
bldwht=${txtbld}$(tput setaf 7) #  white
bldprp=${txtbld}$(tput setaf 5) #  purple
txtrst=$(tput sgr0)             # Reset


function log
{
	echo "${bldblu}$1" >&2
}

function logpartial
{
	printf "${bldblu}$1" >&2
}

function found
{
	echo "   ${bldwht}✓   ${bldprp}$1\t\t\t\t${bldgrn}$2" >&2
}

function missing
{
	echo "   ${bldwht}🅇   ${bldprp}$1 missing\t\t\t\t${bldgrn}-" >&2
}

function require
{
	echo "   ${bldwht}🅇   ${bldprp}$1\t\t\t\t\t${bldred}NOT FOUND" >&2
  	echo "" >&2
  	echo "${bldred}install.sh cannot be installed without $1" >&2
  	echo "Install $1 first, and then try again." >&2
  	echo "" >&2
  	echo "Maybe $1 is installed, but not in the PATH?" >&2
  	echo "Note that running as sudo can change envs." >&2
  	echo ""
  	echo "PATH=$PATH${txtrst}" >&2
	exit 1
}

# make sure we're root
if [ ! "$USER" = "root" ]; then
	echo "You must be root to run this program. Try re-running with sudo $0" >&2
	exit 1
fi

log "Checking system dependencies..."
echo "" >&2

# make sure that node exists
node=`which node 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$node" ]; then
  found "node found" `node --version`
else
  require 'node'
fi

# make sure that npm exists
npm=`which npm 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$npm" ]; then
	found "npm found" `npm --version`
else
	require 'npm'	
fi

# make sure that java exists
java=`which java 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$java" ]; then
	java_version=$(java -version 2>&1 | sed 's/java version "\(.*\)\.\(.*\)\.\(.*\)\"/\1.\2.\3/; 1q')
	found "java found" $java_version
else
	require 'java'
fi 

# make sure we have our ti-install scripts
tii=`which ti-install 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$tii" ]; then
	tii=`npm install https://github.com/jhaynie/ti-install/tarball/master -g 2>&1`
fi 

# make sure that ti exists
ti=`which titanium 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$ti" ]; then
	found "titanium found" `titanium --version`
else
	missing 'titanium'
fi 

# make sure that android exists
android=`which android 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$android" ]; then
	android_dir=`dirname $android`
	android=1
	found "android found" `cat $android_dir/source.properties | sed -n 's/.*Revision=\([^&]*\).*/\1/p'`
else
	android=0
	missing 'android'
fi 

# FIXME: OSX only
# make sure that xcodebuild exists
xcode=`which xcodebuild 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$xcode" ]; then
	xcode=1
	found "xcode found" `xcodebuild -version | sed -n 's/Xcode \([^&]*\).*/\1/p'`
fi 

# cleanup install.log
rm -rf install.log 2>&1

echo "" 2>&1

if [ ! -x "$ti" ]; then
	logpartial 'installing titanium ... '
	ti=`npm install titanium -g >>install.log 2>&1`
	ti=`which titanium 2>&1`
	ret=$?
	if [ $ret -eq 0 ] && [ -x "$ti" ]; then
		echo "${bldgrn}`titanium --version`"
	else
		echo 'Error installing titanium. Please check install.log'
		exit 1
	fi
fi

# install android
if [ $android -eq 0 ]; then
	logpartial 'installing android ... '
	ti-install androidinstall --quiet
	android=`which android 2>&1`
	ret=$?
	if [ $ret -eq 0 ] && [ -x "$android" ]; then
		android_dir=`dirname $android`
	else
		echo 'Error installing android. Please check install.log'		
		exit 1
	fi
	android_dir=`dirname $android`
fi

# run titanium setup to check environment
log "Checking environment..."
ti-install setup
ret=$?
if [ $ret -eq 2 ]; then
	echo ${bldgry} 2>&1
	titanium sdk install latest --force --no-colors --no-banner
	ti-install postinstall
else
	if [ $ret -eq 1 ]; then
		exit $ret
	fi
fi

log 'Your system is ready to use! Codestrong!'

