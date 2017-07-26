var utils = {
	connectionDB : function(mongoose, config){
		var path;

		path = 'mongodb://';
		//path += config.user + ':' + config.password  + '@';
		path += config.db.host + (config.db.port.length > 0 ? ':' : '');		
		path += config.db.port + '/';		
		path += config.db.dbname;
        console.log(path)
		return mongoose.connect(path);
	},
	 createHash : function(password, bCrypt){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	}
};

module.exports = utils;