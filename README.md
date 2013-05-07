Titanium All-in-One Installer
=============================

This is an *EXPERIMENTAL* project to build an all-in-one install script for Titanium.

You can run the installer from a Unix/OSX command shell:

	> curl https://raw.github.com/jhaynie/ti-install/master/install.sh | sudo sh

What does this installer do?
----------------------------

The installer will attempt to discover what software you have on your system and then
attempt to update it where possible.

- Check for node and npm
- Check for java
- Check for titanium CLI (if not found, install it)
- Check for android (if not found, install it)
- Check for xcodebuild (currently, will only warn if not available)
- Check for latest titanium SDK (if not installed, update)

Limitations
-----------

Currently, this installer cannot install Xcode since Apple has it behind a paywall. 

The script will attempt to install Android if not found.

This installer does not yet install Titanium Studio but will eventually.

Environments
------------

Right now, this works on a very limited set of environments.

- Mac OSX 10.8.3


Bug Reportings
--------------

If you find a bug or encountering problems, please open a GitHub issue.  Even better,
fork it, fix it and send me a pull request. :)


Disclaimer
----------

This is experimental software and likely won't work on your system.  Please be careful and backup
your system before using this project on your development machine.  It likely will completely
screw up your dev environment so please be careful!


License
-------
Copyright (c) 2013 by Jeff Haynie, All Rights Reserved.
Licensed under the Apache Public License, v2.
