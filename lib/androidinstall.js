/**
 * Titanium Installer
 * Copyright (c) 2013 by Jeff Haynie. All Rights Reserved.
 * Licensed under the Apache Public License v2.
 */

const REPO_URL = "http://dl-ssl.google.com/android/repository/repository-7.xml",
 	  SDK_URL  = "http://dl.google.com/android/repository/",
 	  PROXY = process.env.http_proxy;

var request = require('request'),
	xml2js = require('xml2js'),
	appc = require('node-appc'),
	android = appc.android,
	zip = appc.zip,
	prompt = require('prompt'),
	path = require('path'),
	fs = require('fs'),
	temp = require('temp'),
	exec = require('child_process').exec,
	spawn = require('child_process').spawn,
	i18n = appc.i18n(__dirname),
	colors = require('colors'),
	__ = i18n.__,
	__n = i18n.__n,
	quiet = false,
	force = false;


prompt.message = '';
prompt.delimiter = ' ';
prompt.start();

for (var c=0;c<process.argv.length;c++)
{
	if (process.argv[c]=='--quiet')
	{
		quiet = true;
	}
	if (process.argv[c]=='--force')
	{
		force = true;
	}
}


String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};	

function androidDir()
{
	switch(os())
	{
		case 'macosx':
			return '/opt/android';
		default:
			throw 'Not yet support for OS: '+os();
	}
}

function os()
{
	switch(process.platform)
	{
		case 'darwin':
			return 'macosx';

		return process.platform;
	}
}

function findForOS(array)
{
	var my_os = os();

	for (var c=0;c<array.length;c++)
	{
		var entry = array[c];
		if (entry.$.os == my_os)
		{
			return {
				size: entry['sdk:size'][0],
				checksum: entry['sdk:checksum'][0]._,
				url: SDK_URL + entry['sdk:url'][0]
			}
		}
	}
}

function findAndroidList(androidDir, callback)
{
	var a = path.join(androidDir,'tools','android'),
		r = /([\d]+)(- )(.*)/,
		rs = /SDK Platform Android ([\d]+\.[\d]+\.?[\d]?), API ([\d]+), revision ([\d]+)/,
		rg = /Google APIs, Android API ([\d]+), revision ([\d]+)/,
		ri = /System Image, Android API ([\d]+), revision ([\d]+)/,
		latestSDK = 0,
		latestGoogle = 0,
		latestSDKEntry,
		latestGoogleEntry,
		supportEntry,
		systemImages = [],
		atomSysImage,
		armSysImage,
		mipsSysImage,
		installed = [];

	exec(a+' list sdk --no-ui --all', function(err, stdout, stderr)
	{
		var tokens = stdout.split('\n'),
			entries = [], 
			required = [];
		for (var c=0;c<tokens.length;c++)
		{
			var line = tokens[c],
				m = r.exec(line);
			//console.log(line);
			if (m)
			{
				var entry = {
					index: m[1],
					name: m[3]
				},
				sdk_m = rs.exec(m[0]),
				g_m = rg.exec(m[0]);

				// these are required dependencies
				if (line.indexOf('Android SDK ') > 0)
				{
					required.push(entry);
				}
				if (line.indexOf('Android Support Library') >0)
				{
					supportEntry = entry;
				}
				if (!atomSysImage && line.indexOf('Atom System Image')>0)
				{
					var sm = ri.exec(line);
					entry.revision = sm[2];
					entry.api = sm[1];
					atomSysImage = m[1];
					var f = path.join(androidDir,'system-images','android-'+entry.api,'atom');
					if (!fs.existsSync(f))
					{
						systemImages.push(entry);
					}
				}
				if (!armSysImage && line.indexOf('ARM EABI v7a System Image')>0)
				{
					var sm = ri.exec(line);
					entry.revision = sm[2];
					entry.api = sm[1];
					armSysImage = m[1];
					var f = path.join(androidDir,'system-images','android-'+entry.api,'armeabi-v7a');
					if (!fs.existsSync(f))
					{
						systemImages.push(entry);
					}
				}
				if (!mipsSysImage && line.indexOf('MIPS System Image')>0)
				{
					var sm = ri.exec(line);
					entry.revision = sm[2];
					entry.api = sm[1];
					mipsSysImage = m[1];
					var f = path.join(androidDir,'system-images','android-'+entry.api,'mips');
					if (!fs.existsSync(f))
					{
						systemImages.push(entry);
					}
				}
				if (line.indexOf('Intel x86 Emulator Accelerator (HAXM)')>0)
				{
					required.push(entry);
				}
				if (sdk_m)
				{
					entry.sdk = true;
					entry.version = sdk_m[1];
					entry.api = sdk_m[2];
					entry.revision = sdk_m[3];
					if (latestSDK <= parseInt(entry.version))
					{
						latestSDK = entry.version;
						latestSDKEntry = entry;
					}
				}
				if (g_m)
				{
					entry.google = true;
					entry.api = g_m[1];
					entry.revision = g_m[2];
					if (latestGoogle <= parseInt(entry.api))
					{
						latestGoogle = entry.api;
						latestGoogleEntry = entry;
					}
				}
				entries.push(entry);
			}
		}
		callback && callback(entries, required, systemImages, supportEntry, latestSDKEntry, latestGoogleEntry);
	});
}

function findAndroidSDKAPI(entries, api)
{
	for (var c=0;c<entries.length;c++)
	{
		if (entries[c].sdk && entries[c].api==api)
		{
			return entries[c];
		}
	}
}

/*
function findTargets(callback)
{
	exec('android list target', function(err, stdout, stderr)
	{
		var tokens = stdout.split('\n'), 
			index = 0, 
			target,
			start,
			r = /^id: (\d+) or "android-(\d+)"/,
			entries = {};

		for (var c=0;c<tokens.length;c++)
		{
			var line = tokens[c],
				m = r.exec(tokens[c]);

			if (m)
			{
				var ver = parseInt(m[2]);
				if (index < ver)
				{
					index = ver;
					target = m[1];
				}
				entries[target] = {};
				start=true;
			}
			else if (line[0]==='-')
			{
				start=false;
				continue;
			}
			else if (/^Available Android targets/.test(line))
			{
				continue;
			}
			else if (/^id/.test(line))
			{
				// add on script
				continue;
			}
			else if (start)
			{
				var i = line.indexOf(':');
				if (i > 0)
				{
					var key = line.substring(0,i).trim(),
						value = line.substring(i+1).trim();
					entries[target][key] = value;
				}
			}
		}
		callback(target, index, entries);
	});
}

function findSuitableTarget(callback)
{
	return findTargets(function(target,index,entries)
	{
		var entry = entries[target],
			abis = entry['ABIs'].split(','),
			skins = entry['Skins'];

		if (abis.length > 1)
		{
			for (var c=0;c<abis.length;c++)
			{
				if (/^arm/.test(abis[c]))
				{
					abis = [abis[c].trim()];
					break;
				}
			}
		}

		if (skins.indexOf('HVGA') >= 0)
		{
			return callback(target, abis[0], 'HVGA');
		}

		// find the first skin and just use it
		return callback(target, abis[0], skins.split(',')[0].trim());
	});
}

*/

function createTitaniumAVD(callback)
{
	var homeDir, androidHomeDir;

	if (process.env['ANDROID_SDK_HOME'])
	{
		homeDir = path.join(process.env['ANDROID_SDK_HOME'], '.titanium');
		androidHomeDir = path.join(process.env['ANDROID_SDK_HOME'], '.android');
	}
	else if (!!process.platform.match(/^win/))
	{
		homeDir = path.join(process.env['USERPROFILE'], '.titanium');
		androidHomeDir = path.join(process.env['USERPROFILE'], '.android');
	}
	else
	{
		var home = appc.fs.home();
		homeDir = path.join(home, '.titanium');
		androidHomeDir = path.join(home, '.android');
	}
	var stat = fs.statSync(home);

	if (!fs.existsSync(homeDir))
	{
		fs.mkdirSync(homeDir);		
		fs.chownSync(homeDir, stat.uid, stat.gid);
		fs.chmodSync(homeDir, '0644');
	}
	if (!fs.existsSync(androidHomeDir))
	{
		fs.mkdirSync(androidHomeDir);		
		fs.chownSync(androidHomeDir, stat.uid, stat.gid);
		fs.chmodSync(androidHomeDir, '0644');
	}
	var avdPath = path.join(androidHomeDir, 'avd');
	if (!fs.existsSync(avdPath))
	{
		fs.mkdirSync(avdPath);
		fs.chownSync(avdPath, stat.uid, stat.gid);
		fs.chmodSync(avdPath, '0755');
	}

/*
	var avdName = 'titanium_7_HVGA',
		avd = path.join(avdPath, avdName+".avd"),
		sdcard = path.join(homeDir, avdName+'.sdcard');

	function mksdcard(callback)
	{
		if (!fs.existsSync(sdcard))
		{
			console.log('Creating Android SD Card');
			exec('mksdcard 128M "'+sdcard+'"', function(err,stdout,stderr)
			{
				fs.chownSync(sdcard, stat.uid, stat.gid);
				fs.chmodSync(sdcard, '0644');
				callback();
			});
		}
		else
		{
			callback();
		}
	}

	function mkAVD(callback)
	{
		if (!fs.existsSync(avd))
		{
			console.log('Creating Android Virtual Device');
			return findSuitableTarget(function(target, abi, skin)
			{
				var args = ['--verbose','create','avd','--name',avdName,'--target',target,'-s',skin,'--abi',abi,'--force', '--sdcard', sdcard];
				var child = spawn('android',args);
				child.stdin.write('no\n');
				child.stdin.end();
				child.on('close',function()
				{
					var ini = path.join(avdPath,'config.ini');
					fs.appendFileSync(ini, 'hw.camera=yes\nhw.gps=yes\n');

					fs.chownSync(ini, stat.uid, stat.gid);
					fs.chmodSync(ini, '0644');


					fs.chownSync(avd, stat.uid, stat.gid);
					fs.chmodSync(avd, '0644');

					var avdini = path.join(avdPath, avdName+".ini");
					fs.chownSync(avdini, stat.uid, stat.gid);
					fs.chmodSync(avdini, '0644');

					callback();
				});
			});
		}	
		else
		{
			callback();
		}
	}

	mksdcard(function()
	{
		mkAVD(callback);
	})

*/
}

function installAndroid(androidDir, callback)
{
	console.log('Installing required Android packages...\n');

	createTitaniumAVD();

	return findAndroidList(androidDir, function(entries, required, systemImages, supportEntry, latestSDK, latestGoogle)
	{
		var indexes = [];

		for (var c=0;c<required.length;c++)
		{
			indexes.push(required[c].index);
		}

		//FIXME: this is currently a dependency in Titanium in <= 3.1.0
		var api8 = findAndroidSDKAPI(entries, '8');
		if (api8)
		{
			indexes.push(api8.index);
		}

		if (latestSDK) indexes.push(latestSDK.index);
		if (latestGoogle) indexes.push(latestGoogle.index);
		if (supportEntry) indexes.push(supportEntry.index);

		if (systemImages)
		{
			for (var c=0;c<systemImages.length;c++)
			{
				indexes.push(systemImages[c].index);
			}
		}

		if (indexes.length == 0)
		{
			return callback(null);
		}

		//TODO: pass in proxy
		var args = ['update','sdk','--filter',indexes.join(','),'--no-ui','--all'];

		var a = spawn(path.join(androidDir,'tools','android'),args),
			error = null;

		a.stdout.on('data',function(buf)
		{
			process.stdout.write(buf);
		});

		a.stderr.on('data',function(buf)
		{
			error+=String(buf);
		});

		a.on('close', function(code)
		{
			callback(error);
		});

	});
}

function addPathToProfile(androidDir, callback)
{
	switch(os())
	{
		case 'macosx':
		case 'linux':
		{
			var home = appc.fs.home();
			var profile = path.join(home, '.profile');
			if (!fs.existsSync(profile))
			{
				profile = path.join(home, '.bash_profile');
			}
			var data = '', found = false;
			if (fs.existsSync(profile))
			{
				data = String(fs.readFileSync(profile));
				var idx = data.indexOf(androidDir);
				if (idx >=0)
				{
					found = true;
				}
			}

			if (!found)
			{
				var t = path.join(androidDir,'tools'),
					p = path.join(androidDir,'platform-tools');
				data+='export PATH='+t+':'+p+':$PATH\n';
				data+='export ANDROID_SDK_ROOT='+androidDir+'\n';
				data+='export ANDROID_SDK_HOME='+androidDir+'\n';
				fs.writeFileSync(profile, data);
			}

			var stat = fs.statSync(home);

			// make sure that the user of the profile owns it and it has correct permissions
			fs.chownSync(profile, stat.uid, stat.gid);
			fs.chmodSync(profile, '0644');

		}
	}
	return callback();
}

function updateDirPermissions(androidDir, callback)
{
	var tools = path.join(androidDir,'tools');

	switch(os())
	{
		case 'macosx':
		case 'linux':
		{
			exec('chmod -R a+rx "'+tools+'"', function(err,stdout,stderr)
			{
				if (err)
				{
					console.error(stderr);
					process.exit(1);
				}

				callback();
			});
			break;
		}
		default:
		{
			return callback();
		}
	}
}

function createAndroidDir()
{
	var dir = androidDir();

	if (!fs.existsSync(dir))
	{
		try
		{
			fs.mkdirSync(dir);
		}
		catch(E)
		{
			if (E.code === 'EACCES')
			{
				console.error('Permission denied creating directory at '+dir.green+'. You might need to run this command as '+'sudo'.blue);
			}
			else
			{
				console.error(String(E));
			}
			process.exit(1);
		}
	}

	console.log('This tool will install the Android SDK to '+dir.green);

	return dir;
}

android.detect(function (env) 
{

	if (!env || !env.sdkPath)
	{
		install(createAndroidDir(), !quiet);
	}
	else
	{
		if (quiet)
		{
			if (force) return install(env.sdkPath, false);
			console.error('Android already installed at '+env.sdkPath.green+'. Use --force to overwrite.');
			process.exit(1);
		}

		var property = {
		  name: 'yesno',
		  message: 'Android already installed at '+env.sdkPath.green+'. Re-install?',
		  validator: /y[es]*|n[o]?/,
		  warning: 'Must respond yes or no',
		  default: 'no'
		};
		prompt.get(property, function (err, result) 
		{
			if (result && /y[es]?/.test(result.yesno))
			{
				install(env.sdkPath, false);
			}
			else
			{
				process.exit(0);
			}
		});
	}
});

function install(androidDir, promptLicense)
{
	request(
	{
		url: REPO_URL,
		proxy: PROXY || undefined
	}, function (error, response, body) 
	{
		if (error) {
			console.error(__('Failed to retrieve %s: %s', desc, error.toString()));
			process.exit(1);
		}

		if (response.statusCode != 200) {
			console.error(__('Failed to retrieve %s: expected 200, got %s', desc, response.statusCode));
			process.exit(1);
		}

		xml2js.parseString(body, function(err, result)
		{
			var license = result['sdk:sdk-repository']['sdk:license'][0]._,
				tool = result['sdk:sdk-repository']['sdk:tool'][0],
				platform = result['sdk:sdk-repository']['sdk:platform-tool'][0],
				sdk_version = tool['sdk:revision'][0],
				platform_version = platform['sdk:revision'][0],
				platform_archives = platform['sdk:archives'][0]['sdk:archive'],
				platform_sdk_entry = findForOS(platform_archives),
				tool_archives = tool['sdk:archives'][0]['sdk:archive'],
				tool_sdk_entry = findForOS(tool_archives),
				tool_version = sdk_version['sdk:major'] + '.' + sdk_version['sdk:minor'] + (sdk_version['sdk:micro'] ? ('.' + sdk_version['sdk:micro']) : ''),
				platform_tool_version = platform_version['sdk:major'] + '.' + platform_version['sdk:minor'] + (platform_version['sdk:micro'] ? ('.' + platform_version['sdk:micro']) : '');


				var property1 = {
				  name: 'yesno',
				  message: 'Read Android License?',
				  validator: /y[es]*|n[o]?/,
				  warning: 'Must respond yes or no',
				  default: 'no'
				},
				property2 = {
				  name: 'yesno',
				  message: 'Continue?',
				  validator: /y[es]*|n[o]?/,
				  warning: 'Must respond yes or no',
				  default: 'yes'
				};

				// write our the android license file
				fs.writeFileSync(path.join(androidDir,'LICENSE.txt'), license);

				// write out the repository file
				fs.writeFileSync(path.join(androidDir,'repository.xml'), body);

				function extractSDK(tempName, dir, onComplete)
				{
					if (path.extname(tempName) === '.zip')
					{
						zip.unzip(tempName, dir, onComplete);
					}
				}

				function downloadSDK(url, dir, onComplete)
				{
					console.log('Downloading '+url.green);

					var tempName = temp.path({suffix: path.extname(url)}),
						tempStream = fs.createWriteStream(tempName),
						req = request({
							url: url,
							proxy: PROXY || undefined
						});

					req.pipe(tempStream);

					req.on('error', function (err) {
						fs.unlinkSync(tempName);
						console.error(__('Failed to download SDK: %s', err.toString()));
					});

					req.on('response', function (req) {
						var total = parseInt(req.headers['content-length']),
							bar = new appc.progress('  :paddedPercent [:bar] :etas', {
								complete: '='.cyan,
								incomplete: '.'.grey,
								width: 40,
								total: total
							}),
							http = require('http');

						if (req.statusCode >= 400) {
							onComplete(__('Request failed with HTTP status code %s %s', req.statusCode, http.STATUS_CODES[req.statusCode] || ''));
						} else {
							req.on('data', function (buffer) {
								bar.tick(buffer.length);
							});

							tempStream.on('close', function () {
								bar.tick(total);
								console.log('\n');
								extractSDK(tempName, dir, onComplete);
							});
						}
					});
				}

				function downloadToolSDK(callback)
				{
					var sp = path.join(androidDir,'tools','source.properties');
					if (fs.existsSync(sp))
					{
						var c = String(fs.readFileSync(sp));
						if (c.indexOf('Pkg.Revision='+tool_version)!=-1)
						{
							return callback(null);
						}
					}
					downloadSDK(tool_sdk_entry.url, androidDir, callback);
				}

				function downloadPlatformToolSDK(callback)
				{
					var sp = path.join(androidDir,'platform-tools','source.properties');
					if (fs.existsSync(sp))
					{
						var c = String(fs.readFileSync(sp));
						if (c.indexOf('Pkg.Revision='+platform_tool_version)!=-1)
						{
							return callback(null);
						}
					}
					downloadSDK(platform_sdk_entry.url, androidDir, callback);
				}

				function download()
				{
					console.log('');

					// download the tools sdk as required
					downloadToolSDK(function()
					{
						// download the platform tools sdk as required
						downloadPlatformToolSDK(function()
						{
							// make sure android is in the path
							addPathToProfile(androidDir, function()
							{
								// change permissions
								updateDirPermissions(androidDir, function()
								{
									installAndroid(androidDir, function(err)
									{
										if (!err)
										{
											console.log('Finished!'.yellow);
											process.exit(0);
										}
										process.exit(err);
									})
								});
							});
						});	
					});	
				}

				if (promptLicense)
				{
					prompt.get(property1, function (err, result) 
					{
						if (result && /y[es]?/.test(result.yesno))
						{
							console.log(license);

							prompt.get(property2, function (err, result) 
							{
								if (result && /y[es]?/.test(result.yesno))
								{
									download();
								}
								else
								{
									process.exit(0);
								}
							});
						}
						else
						{
							download();
						}
					});
				}
				else
				{
					download();
				}
		});
	});

}
