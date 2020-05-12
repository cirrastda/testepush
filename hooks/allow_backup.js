var spawn = require('child_process').spawn;

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

runCmdHandler(".", "npm install --save cordova-plugin-allow-backup --variable BACKUP=false --force");