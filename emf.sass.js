var sass = require('node-sass');
var fs = require('fs');
var util = require('util');
var mime = require('mime');

var controller = require('./emf.controller');
var logger = require('./emf.logger');

function SassController(options) {
	options = options || {};
	controller.Controller.Resource.call(this, options);
}
util.inherits(SassController, controller.Controller.Resource);

SassController.prototype.fileCallback = function(req, res, filePath, data) {
	var contentType = mime.lookup('.css');
	var controller = this;
	
	if ( contentType === undefined ) {
		logger.warn('No MIME type defined for .css');
		contentType = 'text/plain';
	}
	
	sass.render({
		data: data,
		success: function(css) {
			controller.emit('data', req, res, {data: css, headers: { 'Content-Type': contentType}});
			
		},
		error: function(error) {
			controller.emit('error', req, res, {statusCode: 500, data: error});			
		}
	});
};

exports.Controller = SassController;