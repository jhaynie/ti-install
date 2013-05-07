/**
 * Titanium Installer
 * Copyright (c) 2013 by Jeff Haynie. All Rights Reserved.
 * Licensed under the Apache Public License v2.
 */



var exec = require('child_process').exec,
	fs = require('fs'),
	appc = require('node-appc'),
	wrench = require('wrench');

exec('titanium config app.sdk', function(err,stdout,stderr)
{
	var ver = stdout.replace(/^\s+|\s+$/g, "");

	exec('titanium info --output json', function(err,stdout,stderr)
	{
		var config = JSON.parse(stdout),
			entry = config.titanium[ver],
			path = entry ? entry.path : null;

		if (path)
		{
			var home = appc.fs.home(),
				stat = fs.statSync(home);
				uid = parseInt(process.env.SUDO_UID || stat.uid),
				gid = parseInt(process.env.SUDO_GID || stat.gid);

			// make sure that the owner owns the files not root
			wrench.chownSyncRecursive(path, uid, gid);
			wrench.chmodSyncRecursive(path, '0755');
		}
		process.exit(path ? 0 : 1);
	});
});

