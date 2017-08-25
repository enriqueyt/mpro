var utils = {
	getDbConnection: function (mongoose, config) {
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
    
    return mongoose.connect(path);
  },
  
	createHash: function (password, bCrypt) {
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	}
};

module.exports = utils;