/**
 * Titanium Installer
 * Copyright (c) 2013 by Jeff Haynie. All Rights Reserved.
 * Licensed under the Apache Public License v2.
 */

var path = require('path');

function main(args)
{
	if (args.length < 3)
	{
		console.error('Usage: '+path.basename(args[1])+' <command>');
		process.exit(1);
	}
	switch(args[2])
	{
		case 'androidinstall':
			return require('./androidinstall.js');
		case 'postinstall':
			return require('./postinstall.js');
		case 'setup':
			return require('./setup.js');
		default:
			console.log('Unknown command: '+args[2]);
			process.exit(1);
	}
}

main(process.argv);