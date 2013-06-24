var
	http = require('http'),
	util = require('util'),
	url = require('url')
	;

var route = require('./emf.route.js');
var controller = require('./emf.controller.js');

function RouteManager() {
	this.routes = [];
}

RouteManager.prototype.matchRoute = function(path) {
	if ( path instanceof http.IncomingMessage ) {
		path = url.parse(path.url, false).path;
	}
	for ( var index = 0; index < this.routes.length; ++index ) {
		if ( this.routes[index].matches(path) ) {
			return this.routes[index].controller;
		}
	}
	return null;
};

RouteManager.prototype.addRoute = function(pattern, controller) {
	if ( pattern instanceof route.Route ) {
		this.routes[this.routes.length] = pattern;
	} else {
		this.routes[this.routes.length] = route.Route.create(pattern, controller);
	}
	
	console.log('Added %s with controller %s', pattern, controller.name);
};

function Application(options) {
	this.routeManager = new RouteManager();
	this.options = options || {};
}

Application.prototype.requestFinisher = function(req, res) {
	console.log('[%s:%d] %s: responding with %d', req.connection.remoteAddress,
			req.connection.remotePort, req.url, res.statusCode);
	res.end();
};

Application.prototype.requestHandler = function(req, res) {
	console.log('Request from %s:%d', req.connection.remoteAddress, req.connection.remotePort);
	var controller = this.routeManager.matchRoute(req);
	console.log('Controller for %s is %s', req.url, controller.name);
	if ( controller !== null ) {
		console.log('Calling requestHandler for controller');
		try {
			controller.requestHandler(req, res, this.requestFinisher);
		} catch (e) {
			console.log('An exception occurred:', e);
		}
	}
};

Application.prototype.start = function() {
	var application = this;
	var requestHandler = this.options.requestHandler || Application.prototype.requestHandler;
	var listenPort = this.options.listenPort || 8888;
	var listenAddress = this.options.listAddress || '127.0.0.1';
	function onRequest(req, res) {
		requestHandler.call(application, req, res);
	}
	http.createServer(onRequest).listen(listenPort, listenAddress);
	console.log('Application listening on %s:%d', listenAddress, listenPort);
};

exports.Controller = controller.Controller;
exports.Application = Application;
exports.Route = route.Route;
exports.StaticRoute = route.StaticRoute;
exports.RegExpRoute = route.RegExpRoute;
exports.GlobRoute = route.GlobRoute;
exports.NamedRoute = route.NamedRoute;
