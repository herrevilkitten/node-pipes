var sass = require('node-sass');
var fs = require('fs');
var util = require('util');

var controller = require('./emf.controller');
var logger = require('./emf.logger');

function SassController(options) {
	options = options || {};
	controller.Controller.Resource.call(this, options);
}
util.inherits(SassController, controller.Controller.Resource);

SassController.prototype.fileCallback = function(req, res, filePath, data) {
	logger.info('Time to get sassy!');
	var contentType = mime.lookup(filePath);
	if ( contentType === undefined ) {
		logger.warn('No MIME type defined for %s', filePath);
		contentType = 'text/plain';
	}
	this.emit('data', req, res, {data: data, headers: { 'Content-Type': contentType}});
};

exports.Controller = SassController;