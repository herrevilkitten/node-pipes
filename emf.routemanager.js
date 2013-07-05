var http = require('http');
var url = require('url');
var path = require('path');

var route = require('./emf.route');
var logger = require('./emf.logger');

var HTTP_METHODS = [ 'get', 'head', 'post', 'put', 'delete' ];
function RouteManager() {
	this.routes = {};
	for ( var index = 0; index < HTTP_METHODS.length; ++index ) {
		var method = HTTP_METHODS[index].toUpperCase();
		this.routes[method] = [];
	}
}

RouteManager.prototype.matchRoute = function(method, path) {
	if (method instanceof http.IncomingMessage) {
		path = url.parse(method.url, false).path;
		method = method.method;
	}

	method = method.toUpperCase();
	logger.verbose('Looking for controller to match', method, path);
	for ( var index = 0; index < this.routes[method].length; ++index) {
		logger.verbose('Comparing against', this.routes[method][index]);
		if (this.routes[method][index].matches(path)) {
			return this.routes[method][index].controller;
		}
	}
	return null;
};

RouteManager.prototype.add = function(pattern, controller, methods, parameters) {
	methods = methods || [ 'GET' ];
	var rte = (pattern instanceof route.RegExp) ? pattern : route.create(
			pattern, controller, parameters);
	for ( var index = 0; index < methods.length; ++index) {
		var method = methods[index].toUpperCase();

		if (this.routes[method] === undefined || this.routes[method] === null) {
			continue;
		}
		this.routes[method][this.routes[method].length] = rte;

		logger.info('Added route %s %s with %s', method, rte.pattern,
				controller.name ? controller.name : controller.constructor.name);
	}
};

/*
 * Create helper methods for each of the HTTP methods
 */
for ( var index = 0; index < HTTP_METHODS.length; ++index ) {
	var method = HTTP_METHODS[index];
	(function(m) {
		RouteManager.prototype[method] = function(pattern, controller, parameters) {
			this.add(pattern, controller, [m], parameters);
		};
	})(method);
}

exports.RouteManager = RouteManager;