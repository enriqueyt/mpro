var path = require('path');

var dbName = process.env.DB_PATH || 'db.test.json';

module.exports.dbUrl = path.resolve('../config/', dbName);
module.exports.dbPath = require(module.exports.dbUrl);