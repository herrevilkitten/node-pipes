var util = require('util');
var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var events = require('events');
var mime = require('./emf.mime');

function Controller() {
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

function FileController() {
	Controller.call(this);

	this.baseDirectory = __dirname;
}
util.inherits(FileController, Controller);

FileController.prototype.requestHandler = function(req, res) {
	var controller = this;
	var reqUrl = url.parse(req.url, false);
	var filePath = path.join(this.baseDirectory, reqUrl.path);
	
	console.log('Reading %s', filePath);
	
	fs.readFile(filePath, function(err, data) {
		if (err) {
			controller.emit('error', req, res, {statusCode: 404});
		} else {
			var contentType = mime.lookup(filePath);
			if ( contentType === undefined ) {
				console.log('No MIME type defined for %s', filePath);
				contentType = 'text/plain';
			}
			controller.emit('data', req, res, {data: data, headers: { 'Content-Type': contentType}});
		}
	});
};


Controller.NotFound = NotFoundController;
Controller.File = FileController;

exports.Controller = Controller;