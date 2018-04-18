const fs = require('fs');
const path = require('path');

// Define absolute paths for original pkg and temporary pkg.
const PACKAGE_PATH = path.resolve(__dirname, '../package.json');
const CACHED_PACKAGE_PATH = path.resolve(__dirname, '../cached-package.json');

// Obtain original/cached contents from `cached-package.json`.
const packageData = JSON.stringify(require(CACHED_PACKAGE_PATH), null, 2) + '\n';

// Write data from `cached-package.json` back to original `package.json`.
fs.writeFile(PACKAGE_PATH, packageData, function (err) {
  if (err) throw err;
});

// Delete the temporary `cached-package.json` file.
fs.unlink(CACHED_PACKAGE_PATH, function (err) {
  if (err) throw err;
});