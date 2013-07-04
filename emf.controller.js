var util = require('util');
var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var events = require('events');
var mime = require('./emf.mime');
var logger = require('./emf.logger');

function Controller(options) {
	events.EventEmitter.call(this);
	this.bound = false;
}
util.inherits(Controller, events.EventEmitter);

Controller.prototype.requestHandler = function(req, res) {
	this.emit('data', req, res, {data: '\n'});
};

function NotFoundController() {
	Controller.call(this);
}
util.inherits(FileController, Controller);

NotFoundController.prototype.requestHandler = function(req, res) {
	this.emit('error', req, res, {statusCode: 404});
};

function FileController(options) {
	options = options || {};
	Controller.call(this, options);

	this.baseDirectory = options.baseDirectory || process.cwd();
}
util.inherits(FileController, Controller);

FileController.prototype.requestHandler = function(req, res) {
	this.handleFile(req, res, null, this.fileCallback);
};

FileController.prototype.fileCallback = function(req, res, filePath, data) {
	var contentType = mime.lookup(filePath);
	if ( contentType === undefined ) {
		logger.warn('No MIME type defined for %s', filePath);
		contentType = 'text/plain';
	}
	this.emit('data', req, res, {data: data, headers: { 'Content-Type': contentType}});
};

FileController.prototype.handleFile = function(req, res, filePath, callback) {
	var controller = this;
	if ( filePath === null || filePath === undefined ) {
		var reqPath = url.parse(req.url, false).path;
		filePath = path.normalize(path.join(this.baseDirectory, reqPath));		
	}

	logger.info('Reading %s', filePath);
	if ( !fs.existsSync(filePath) ) {
		controller.emit('error', req, res, {statusCode: 404});
		return;
	}

	if ( filePath.indexOf(this.baseDirectory) !== 0 ) {
		controller.emit('error', req, res, {statusCode: 403});
		return;
	}
		
	fs.readFile(filePath, function(err, data) {
		if (err) {
			controller.emit('error', req, res, {statusCode: 404});
		} else {
			callback.call(controller, req, res, filePath, data);
		}
	});
};

function ResourceController(options) {
	options = options || {};
	FileController.call(this, {
		baseDirectory: options.baseDirectory || path.join(process.cwd(), 'resources')
	});
}
util.inherits(ResourceController, FileController);

function PublicController(options) {
	options = options || {};
	FileController.call(this, {
		baseDirectory: options.baseDirectory || path.join(process.cwd(), 'public')
	});
}
util.inherits(PublicController, FileController);

Controller.NotFound = NotFoundController;
Controller.File = FileController;
Controller.Resource = ResourceController;
Controller.Public = PublicController;

exports.Controller = Controller;