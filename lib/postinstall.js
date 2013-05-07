/**
 * Titanium Installer
 * Copyright (c) 2013 by Jeff Haynie. All Rights Reserved.
 * Licensed under the Apache Public License v2.
 */



var exec = require('child_process').exec,
	fs = require('fs'),
	appc = require('node-appc'),
	wrench = require('wrench'),
	path = require('path');

exec('titanium config app.sdk', function(err,stdout,stderr)
{
	var ver = stdout.replace(/^\s+|\s+$/g, "");

	exec('titanium info --output json', function(err,stdout,stderr)
	{
		var config = JSON.parse(stdout),
			entry = config.titanium[ver],
			sdkPath = entry ? entry.path : null;

		if (sdkPath)
		{
			var home = appc.fs.home(),
				stat = fs.statSync(home);
				uid = parseInt(process.env.SUDO_UID || stat.uid),
				gid = parseInt(process.env.SUDO_GID || stat.gid),
				tilib = path.join(sdkPath, '..', '..');

			// make sure that the owner owns the files not root
			wrench.chownSyncRecursive(sdkPath, uid, gid);
			wrench.chmodSyncRecursive(sdkPath, '0755');

			wrench.chownSyncRecursive(tilib, uid, gid);
			wrench.chmodSyncRecursive(tilib, '0755');
		}
		process.exit(sdkPath ? 0 : 1);
	});
});

