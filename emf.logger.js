var http = require('http');
var util = require('util');

var winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	timestamp: true,
	colorize: true
});

function log() {
	var args = Array.prototype.slice.call(arguments);
	if ( args[1] instanceof http.IncomingMessage ) {
		var req = args.splice(1, 1)[0];
		args.splice(1, 1, util.format('[%s:%d] [%s] %s', req.connection.remoteAddress,
				req.connection.remotePort, req.url, args[1])); 
	}
	winston.log.apply(null, args);
}

function verbose() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('verbose');
	log.apply(null, args);
}

function info() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('info');
	log.apply(null, args);	
}

function warn() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('warn');
	log.apply(null, args);	
}

function error() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('error');
	log.apply(null, args);	
}

exports.log = log;
exports.verbose = verbose;
exports.info = info;
exports.warn = warn;
exports.error = error;