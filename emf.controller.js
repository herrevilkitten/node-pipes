var util = require('util');
var fs = require('fs');
var url = require('url');
var path = require('path');

function Controller() {
	
}

Controller.prototype.requestHandler = function(req, res, callback) {
	res.writeHead(200, { 'Content-Type': 'text/plain'});
	res.write('\n');
	callback(req, res);
};

function FileController() {
	Controller.call(this);

	this.baseDirectory = __dirname;
}
util.inherits(FileController, Controller);

FileController.prototype.requestHandler = function(req, res, finisher) {
	var reqUrl = url.parse(req.url, false);
	var filePath = path.join(this.baseDirectory, reqUrl.path);
	
	console.log('Reading %s', filePath);
	
	fs.readFile(filePath, function(err, data) {
		if (err) {
			res.statusCode = 404;
			console.log(err);
		} else {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'text/plain');
			res.write(data);
		}
		finisher(req, res);
	});
};


Controller.File = FileController;

exports.Controller = Controller;
