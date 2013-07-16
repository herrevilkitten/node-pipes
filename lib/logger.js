var http = require('http');
var util = require('util');

var winston = require('winston');
var strftime = require('strftime');

/*
 * Configure winston
 */
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	timestamp: function() {
		return strftime('%F %T');
	},
	colorize: true
});

var LOG_LEVELS = [ 'verbose', 'info', 'warn', 'error', 'trace' ];

function log() {
	var args = Array.prototype.slice.call(arguments);
	if ( args[1] instanceof http.IncomingMessage ) {
		var req = args.splice(1, 1)[0];
		args.splice(1, 1, util.format('[%s:%d] [%s] %s', req.connection.remoteAddress,
				req.connection.remotePort, req.url, args[1])); 
	}
	winston.log.apply(null, args);
}

/*
 * Export helper methods for each log level
 */
for ( var index = 0; index < LOG_LEVELS.length; ++index ) {
	var level = LOG_LEVELS[index];
	(function(l) {
		exports[l] = function() {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(l);
			log.apply(null, args);			
		};
	}(level));
}

exports.log = log;
