var util = require('util');
var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var mime = require('./mime');
var logger = require('./logger');
var cookie = require('tough-cookie').Cookie;
var zlib = require('zlib');

var error = require('./error.js');

function fileNotFound() {
	throw new error.HttpError(404);
}

function verifyFile(filename, baseDirectory) {
	if ( !fs.existsSync(filename) ) {
		throw new error.HttpError(404);
	}

	if ( filename.indexOf(baseDirectory) !== 0 ) {
		throw new error.HttpError(403);
	}	

	var contentType = mime.lookup(filename);
	if ( contentType === undefined ) {
		logger.warn('No MIME type defined for %s', filePath);
		contentType = 'text/plain';
	}
	
	return contentType;
}

function streamFile(filename, args, state) {
	var baseDirectory = args.baseDirectory || process.cwd();
	filename = path.normalize(path.join(baseDirectory, filename));		

	logger.info('Checking for existence of %s', filename);
	var mimeType = verifyFile(filename, baseDirectory);
	
	var readStream = fs.createReadStream(filename);
	readStream.mimeType = mimeType;
	state.readStream = readStream;
}

function zipStream(state, req, res) {
	if ( state.readStream === undefined || state.readStream === null ) {
		throw new error.HttpError(500);
	}
	
	var acceptEncoding = req.headers['accept-encoding'];
	if ( acceptEncoding === null ) {
		return;
	}
	
	var encodingList = acceptEncoding.toLowerCase().split(/\s*,\s*/);
	for ( var index = 0; index < encodingList.length; ++index ) {
		var q = 1;
		var encodingInfo = encodingList[index].split(/\s*;\s*/);
		if ( encodingInfo[0] !== 'gzip' && encodingInfo[0] !== 'deflate' ) {
			encodingInfo = [ '', 'q=0' ];
		}
		for ( var j = 1; j < encodingInfo.length; ++j ) {
			var matches = encodingInfo[j].match(/q=(.+)/);
			if ( matches ) {
				q = matches[1];
				break;
			}
		}

		encodingList[index] = [encodingInfo[0], parseFloat(q)];
	}
	encodingList.sort(function(a, b) {
		return (a[1] > b[1]) ? -1 : (a[1] < b[1]) ? 1 : 0;
	});
	
	var chosenEncoding = encodingList[0];
	if ( chosenEncoding[1] === 0 ) {
		logger.info(req, 'No available encoding');
		return;
	}
	var writeStream;
	if ( chosenEncoding[0] === 'deflate' ) {
		writeStream = zlib.createDeflate();
	} else if ( chosenEncoding[0] === 'gzip' ) {
		writeStream = zlib.createGzip();		
	} else {
		logger.warn(req, 'Unsupported encoding type %s', chosenEncoding[0]);
		return;
	}
	logger.info(req, 'Encoding with %s', chosenEncoding[0]);
	res.setHeader('Content-Encoding', chosenEncoding[0]);
	state.readStream.pipe(writeStream);
	state.readStream = writeStream;
}

function sendStream(readStream, res) {
	if ( readStream === undefined || readStream === null ) {
		throw new error.HttpError(500);
	}

	res.setHeader('Content-Type', readStream.mimeType);
	readStream.pipe(res);
}

function sendError(statusCode, statusMessage, req, res) {
	if ( statusCode === undefined || statusCode === null ) {
		statusCode = 500;
	}

	if ( statusMessage === undefined || statusMessage === '' ) {
		statusMessage = 'An error has occurred while processing this request.\n\n' + req.url + '\n\n'
		+ statusCode + ' ' + http.STATUS_CODES[statusCode] + '\n';
	}
	
	res.writeHead(statusCode);
	res.write(statusMessage);
	res.end();
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

exports.fileNotFound = fileNotFound;
exports.streamFile = streamFile;
exports.sendError = sendError;
exports.sendStream = sendStream;
exports.zipStream = zipStream;
exports.parseCookies = parseCookies;
exports.end = end;
