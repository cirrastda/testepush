#!/usr/bin/env node
var fs = require('fs');

module.exports = function (context) {
  // Get the contents of the platform build script.
  var build = fs.readFileSync('platforms/ios/Podfile', 'utf8');
  var lines = build.split
  /**
   * Search for 
   * .xcworkspace', 'project.pbxproj'
   * Replace with
   * .xcodeproj’, ‘project.pbxproj’
   */
  //var replace = build.replace(/\.xcworkspace',\'sproject\.pbxproj'/g, ".xcodeproj', 'project.pbxproj'");
  //var nBuild = build += "post_install do |lib| \n";
  //nBuild+="  lib.pods_project.targets.each do |target| \n";
  //nBuild+="      target.build_configurations.each do |config| \n";
  //nBuild+="          config.build_settings.delete 'IPHONEOS_DEPLOYMENT_TARGET' \n";
  //nBuild+="          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '9.2' \n";
  //nBuild+="      end \n";
  //nBuild+="  end \n";
  //nBuild+="end \n";

  var nBuild = build;
  if (nBuild.search("post_install")<0) {
    nBuild+="post_install do |installer| \n";
    nBuild+="  installer.generated_projects.each do |project| \n";
    nBuild+="    project.build_configurations.each do |config| \n";
    nBuild+="        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 8.0 \n";
    nBuild+="          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '8.0' \n";
    nBuild+="        end \n";
    nBuild+="    end \n";
    nBuild+="    project.targets.each do |target| \n";
    nBuild+="      target.build_configurations.each do |config| \n";
    nBuild+="        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 8.0 \n";
    nBuild+="          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '8.0' \n";
    nBuild+="        end \n";
    nBuild+="      end \n";
    nBuild+="    end \n";
    nBuild+="  end \n";
    nBuild+="end \n";
  }
  /**
   * Save reverted modifications.
   */
  fs.writeFileSync('platforms/ios/Podfile', nBuild);
};