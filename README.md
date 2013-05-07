Titanium All-in-One Installer
=============================

This is an *EXPERIMENTAL* project to build an all-in-one install script for [Appcelerator Titanium](http://github.com/appcelerator/titanium_mobile).

You can run the installer from a Unix/OSX command shell:

	> sudo curl https://raw.github.com/jhaynie/ti-install/master/install.sh | sudo sh

After installation, you should create a new project:

	> titanium create --platforms android --id com.foo --name foo --type app --url http://foo.com -d .

Then run the android simulator:

	> cd foo
	> titanium build --platform android --avd-id 2

As of Titanium 3.1.0 there is a [bug](https://jira.appcelerator.org/browse/TIMOB-13775) that prevents  Android from running if you don't specify an avd-id and if you have fewer than 7 defined platforms in your Android environment (crazy, i know).  This has been fixed and is available in the upcoming 3.2.0 release, which means you will no longer need to specify the avd-id.  If you are using Studio, you will not experience this bug since Studio correctly passes the right avd-id each time it launches the CLI.


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

This requires Titanium SDK 3.1.0 or later (might work with 3.0 but hasn't been tested and likely won't).

Currently, this installer cannot install Xcode since Apple has it behind a paywall. 

The script will attempt to install Android if not found.

This installer does not yet install Titanium Studio but will eventually.

To Do
-----

- Add Studio Download & Install Support
- Add Proxy Support


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
