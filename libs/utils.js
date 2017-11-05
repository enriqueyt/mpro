var Moment = require('moment');

var Utils = {
	getDbConnection: function (handler, config) {
    var path = 'mongodb://';

		path = path.concat(
      // config.user,
      // ':',
      // config.password,
      // '@',
      config.db.host,
      (config.db.port.length > 0 ? ':' : ''),		
      config.db.port, 
      '/',
      config.db.name);

    console.log(path)

    return handler.connect(path);
  },

	createHash: function (password, bCrypt) {
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  },
  
  createUniqueId: function (prefix) {
    var pid = (process !== undefined && process.id !== undefined ? process.id.toString(36) : '');
    var now = function () {
      var time = Date.now();
      var last = now.last || time;
      return now.last = time > last ? time : last + 1;
    }
    
    return (prefix || '') + pid + now().toString(36);
  },

  formatDate: function (date, format) {
    return Moment(date.toString()).format(format);
  }
};

module.exports = Utils;