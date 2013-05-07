/**
 * Titanium Installer
 * Copyright (c) 2013 by Jeff Haynie. All Rights Reserved.
 * Licensed under the Apache Public License v2.
 */


var exec = require('child_process').exec,
	colors = require('colors');


function fail(msg)
{
	console.log(msg.red);
	process.exit(1);
}

function finish(code)
{
	process.exit(code);
}

exec('titanium info --output json', function(err,stdout,stderr)
{
	var config = JSON.parse(stdout);

	if (process.platform == 'darwin')
	{
		if (!config.xcode)
		{
			fail('Xcode not found, you will not be able to create iOS apps until you install. Please install from http://developer.apple.com');
		}
		else
		{
			if (!config.iosCerts || !config.iosCerts.devNames || !config.iosCerts.devNames.length===0)
			{
				fail('No iOS Development Certificate installed. Please install from http://developer.apple.com');
			}
			if (!config.iosCerts.wwdr)
			{
				fail('No iOS WWDR Intermediate Certificate installed. Please install from http://developer.apple.com');
			}
			if (!config.iOSProvisioningProfiles)
			{
				fail('No iOS Provisioning Profile installed. Please install from http://developer.apple.com');
			}
			if (config.iOSProvisioningProfiles &&
				!config.iOSProvisioningProfiles.development ||
				config.iOSProvisioningProfiles.development.length===0)
			{
				fail('No iOS Development Provisioning Profile installed. Please install from http://developer.apple.com');
			}
		}
	}

	if (!config.android)
	{
		fail('Android is not installed. Please install Android from http://www.android.org');
	}
	else
	{
		//check for android targets
		if (!config.android.targets)
		{
			fail('No android targets configured');
		}
		else
		{
			var keys = Object.keys(config.android.targets),
				api8Found = false;
			for (var c=0;c<keys.length;c++)
			{
				var target = config.android.targets[keys[c]];
				if (target['api-level']=='8')
				{
					api8Found = true;
					break;
				}
			}
			// this is a sanity check and really shouldn't happen unless removed after installing
			if (!api8Found)
			{
				fail('Android 2.2 is required before continuing. Please install 2.2 (api level 8)');
			}
		}
	}

	process.stdout.write('Checking Titanium SDK version... ');
	exec('titanium sdk update --no-colors --no-banner', function(err,stdout,stderr)
	{
		var re = /You're up-to-date. Version (.*) is currently the newest version available/,
			nr = /New version available! (.*)/,
			m = re.exec(stdout),
			m2 = nr.exec(stdout);

			if (m && m[1])
			{
				console.log(m[1].green+' ✓'.white);
				finish(0);
			}
			else if (m2)
			{
				var newver = m2[1];
				// select the new sdk before we install so it's ready when we finish
				exec('titanium config app.sdk '+newver, function(err,stdout,stderr)
				{
					finish(2);
				});
			}
	});

});
