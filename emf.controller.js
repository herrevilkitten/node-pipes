var util = require('util');
var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var mime = require('./emf.mime');
var logger = require('./emf.logger');
var events = require('events');
var cookie = require('tough-cookie').Cookie;

function fileNotFound(event) {
	event.emit('error', {statusCode: 404});
}

function sendFile(filename, args, event, res) {
	var baseDirectory = args.baseDirectory || process.cwd();
	filename = path.normalize(path.join(baseDirectory, filename));		

	logger.info('Checking for existence of %s', filename);
	if ( !fs.existsSync(filename) ) {
//		event.emit('error', req, res, {statusCode: 404});
		return;
	}

	if ( filename.indexOf(baseDirectory) !== 0 ) {
//		controller.emit('error', req, res, {statusCode: 403});
		return;
	}

	var contentType = mime.lookup(filename);
	if ( contentType === undefined ) {
		logger.warn('No MIME type defined for %s', filePath);
		contentType = 'text/plain';
	}
	
	var readStream = fs.createReadStream(filename);
	readStream.pipe(res);
}

function streamFile(filename, args, model) {
	var baseDirectory = args.baseDirectory || process.cwd();
	filename = path.normalize(path.join(baseDirectory, filename));		

	logger.info('Checking for existence of %s', filename);
	if ( !fs.existsSync(filename) ) {
//		event.emit('error', req, res, {statusCode: 404});
		return;
	}

	if ( filename.indexOf(baseDirectory) !== 0 ) {
//		controller.emit('error', req, res, {statusCode: 403});
		return;
	}

	var mimeType = mime.lookup(filename);
	if ( mimeType === undefined ) {
		logger.warn('No MIME type defined for %s', filePath);
		mimeType = 'binary/octet-stream';
	}
	
	var readStream = fs.createReadStream(filename);
	readStream.mimeType = mimeType;
	model.readStream = readStream;
}

function sendStream(readStream, res) {
	if ( readStream === null || readStream === undefined ) {
		return;
	}

	res.setHeader('Content-Type', readStream.mimeType);
	readStream.pipe(res);
}

function parseCookies(req) {
	var cookieList = [];
	var cookies = {};
	var cookieMap = {};

	if ( req.headers['set-cookie'] ) {
		if (util.isArray(req.headers['set-cookie'])) {
			cookieList = req.headers['set-cookie'].map(cookie.parse);
		} else {
			cookieList = [ cookie.parse(req.headers['set-cookie']) ];
		}		

		for ( var index = 0; index < cookieList.length; ++index) {
			var key = cookieList[index].key;
			cookies[key] = cookieList[index];
			cookieMap[key] = cookieList[index].value;
		}
		
		req.cookies = cookies;
	}
}

function end(res) {
	res.end();
}

exports.controller = {
	'fileNotFound': fileNotFound,
	'sendFile': sendFile,
	'sendStream': sendStream,
	'streamFile': streamFile,
	'parseCookies': parseCookies,
	'end': end
};