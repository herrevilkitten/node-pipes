var http = require('http');
var url = require('url');
var path = require('path');

var route = require('./emf.route');
var logger = require('./emf.logger');

function RouteManager() {
	this.routes = [];
}

RouteManager.prototype.matchRoute = function(method, path) {
	for ( var index = 0; index < this.routes.length; ++index) {
		var parameters = this.routes[index].matches(method, path);
		if (parameters !== undefined && parameters !== null) {
			return parameters;
		}
	}
	return null;
};

RouteManager.prototype.add = function(method, pattern, controller, parameters) {
	method = method || route.methods.GET;
	var rte = (pattern instanceof route.RegExp) ? pattern : route.create(
			method, pattern, parameters);
	this.routes.push(rte);

	if ( controller ) {
		rte.to(controller);		
	}
	
	if ( parameters ) {
		rte.parameters(parameters);		
	}

	return rte;
};

/*
 * Create helper methods for each of the HTTP methods
 */
for ( var method in route.methods ) {
	(function(m) {
		RouteManager.prototype[m.toLowerCase()] = function(pattern, controller, parameters) {
			return this.add(m.toUpperCase(), pattern, controller, parameters);
		};
	})(method);
}

exports.RouteManager = RouteManager;