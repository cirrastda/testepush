/*
  This script uses as a cordova hook and provides ability to add android permissions to AndroidManifest.xml on the fly. It also 
  checks and computes which of provided permissions are already added and didn't rewrite AndroidManifest.xml if no permissions provided.
  Executes only for android platform.
  
  Prerequirements:
   - node 4.2+
   - npm modules: lodash, xml2js
   
  Distributed under the MIT license. 
  
  Author https://github.com/likerRr.
*/

// create a file 020_add_android_permissions.js in your hooks/after_prepare folder with the following code:

#!/usr/bin/env node

'use strict';

const fs = require('fs');
const _ = require('lodash');
const xml2js = require('xml2js');

// here add/remove permissions you need for Android app
let permissions = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.ACCESS_WIFI_STATE'
];

module.exports = function (context) {
  const parseString = xml2js.parseString;
  const builder = new xml2js.Builder();
  const manifestPath = context.opts.projectRoot + '/platforms/android/AndroidManifest.xml';
  const androidManifest = fs.readFileSync(manifestPath).toString();

  let manifestRoot,
    missedPermissions;

  if (androidManifest && permissions.length > 0) {
    parseString(androidManifest, (err, manifest) => {
      if (err) return console.error(err);

      manifestRoot = manifest['manifest'];

      if (!manifestRoot['uses-permission']) {
        manifestRoot['uses-permission'] = [];
      }

      missedPermissions = _.difference(permissions, _.map(manifestRoot['uses-permission'], `$['android:name']`));

      if (missedPermissions.length > 0) {
        missedPermissions.forEach(perm => manifestRoot['uses-permission'].push({'$': {'android:name': perm}}));

        fs.writeFileSync(manifestPath, builder.buildObject(manifest));

        console.log(`Added ${missedPermissions.length} permissions:`);
        missedPermissions.forEach(perm => console.log(` - ${perm}`));
      }
    });
  }
};