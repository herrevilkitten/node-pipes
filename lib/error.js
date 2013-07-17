var util = require('util');
var http = require('http');

function HttpError(statusCode, statusMessage) {
	if ( statusCode === undefined ) {
		statusCode = 500;
	}
	
	if ( statusMessage === undefined ) {
		statusMessage = '';
	}

	this.statusCode = statusCode;
	this.statusMessage = statusMessage;
	this.name = 'HttpError';
	this.message = util.format('%d %s', statusCode, statusMessage);
}
util.inherits(HttpError, Error);

exports.HttpError = HttpError;