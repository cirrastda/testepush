var spawn = require('child_process').spawn;

const fs = require('fs');
const _ = require('lodash');
// const xml2js = require('xml2js');
const xml = require('cordova-common').xmlHelpers;
const path = require('path');

function spawnProcess(dir, cmd) {
  return (process.platform.toLowerCase().indexOf("win") >= 0) 
    ? spawnWindowsProcess(dir, cmd)
    : spawnLinuxProcess(dir, cmd);
}

function spawnWindowsProcess(dir, cmd) {
  return spawn("cmd.exe", ["/c", cmd], {cwd: dir});
}

function spawnLinuxProcess(dir, cmd) {
  var cmdParts = cmd.split(/\s+/);

  return spawn(cmdParts[0], cmdParts.slice(1), { cwd: dir});
}

function runCmdHandler(dir, cmd) {
  var process = null;

  try {
    process = spawnProcess(dir, cmd);
  } catch (e) {
    console.error("Error trying to execute command '" + cmd + "' in directory '" + dir + "'");
    console.error(e);
    console.log("error", e.message);
    console.log("finished");
    return;
  }

  process.stdout.on('data', function (data) {
    console.log("progress", data.toString('utf-8'));
  });

  process.stderr.on('data', function (data) {
    console.log("error", data.toString('utf-8'));
  });

  process.on('exit', function (code) {
    // var fs = require('fs'),
    // path = require('path'),
    // xml = require('cordova-common').xmlHelpers;

    // var manifestPath = path.join(ctx.opts.projectRoot, 'platforms/android/AndroidManifest.xml');
    // var doc = xml.parseElementtreeSync(manifestPath);
    // if (doc.getroot().tag !== 'manifest') {
    //   throw new Error(manifestPath + ' has incorrect root node name (expected "manifest")');
    // }

    // console.log(doc.getroot().find('./application'));
    // console.log(doc.getroot().find('./application').attrib['android:allowBackup']);
    // doc.getroot().find('./application').attrib['android:allowBackup'] = "false";

    // //write the manifest file
    // fs.writeFileSync(manifestPath, doc.write({
    //   indent: 4
    // }), 'utf-8');
    /*
    var source = "./build-stuff/android/google-services.json";
    var target = "./platforms/android/app/google-services.json";
    const fs = require('fs-extra');  
    // Async with promises:  
    fs.copy(source, target)  
    .then(() => console.log('success!'))  
    .catch(err => console.error(err));  
    */
    console.log("finished");
  });
}

module.exports = function (context) {
  // const parseString = xml2js.parseString;
  // const builder = new xml2js.Builder();
  const DS = ((process.platform.toLowerCase().indexOf("win") >= 0) ? '\\' : '/');

  const manifestPath = context.opts.projectRoot + DS + 'platforms'+DS+'android'+DS+'app'+DS+'src'+DS+'main'+DS+'AndroidManifest.xml';
  const androidManifest = fs.readFileSync(manifestPath).toString();

  console.log(androidManifest);
  var doc = xml.parseElementtreeSync(manifestPath);
  if (doc.getroot().tag !== 'manifest') {
    throw new Error(manifestPath + ' has incorrect root node name (expected "manifest")');
  }

  console.log(doc.getroot().find('./application'));
  console.log(doc.getroot().find('./application').attrib['tools:replace']);
  doc.getroot().attrib['xmlns:tools'] = "http://schemas.android.com/tools";
  doc.getroot().find('./application').attrib['tools:replace'] = "android:appComponentFactory";
  doc.getroot().find('./application').attrib['android:appComponentFactory'] ="android.support.v4.app.CoreComponentFactory"

  //write the manifest file
  fs.writeFileSync(manifestPath, doc.write({
    indent: 4
  }), 'utf-8');

};

// runCmdHandler(".", "npm install --save fs-extra");