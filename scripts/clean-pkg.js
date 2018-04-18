const fs = require('fs');
const path = require('path');

// Define absolute paths for original pkg and temporary pkg.
const PACKAGE_PATH = path.resolve(__dirname, '../package.json');
const CACHED_PACKAGE_PATH = path.resolve(__dirname, '../cached-package.json');

// Obtain original `package.json` contents.
const packageData = require(PACKAGE_PATH);
const scriptsToRemove = [
  'start:dev', 
  'pretest', 'test', 'posttest',
  'lint', 
  'build:clean', 'prebuild', 'build', 'postbuild', 
  'prebuild:dev', 'build:dev', 'postbuild:dev'
];
const devDepsToRemove = process.argv[3] ? process.argv[3].split(',') : [];

// Write/cache the original `package.json` data to `cached-package.json` file.
fs.writeFile(CACHED_PACKAGE_PATH, JSON.stringify(packageData), function (err) {
  if (err) throw err;
});

// Remove the specified named scripts from the scripts section.
scriptsToRemove.forEach(function (scriptName) {
  delete packageData.scripts[scriptName];
});

// Remove devDependencies section.
delete packageData.devDependencies;

// Overwrite original `package.json` with new data (i.e. minus the specific data).
fs.writeFile(PACKAGE_PATH, JSON.stringify(packageData, null, 2), function (err) {
  if (err) throw err;
});