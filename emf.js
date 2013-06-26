var http = require('http'), util = require('util'), url = require('url');
var events = require('events');

var route = require('./emf.route');
var controller = require('./emf.controller');

function FilterManager() {
	this.filters = [];
}

FilterManager.prototype.addFilter = function(filter) {
	this.filters[this.filters.length] = filter;
};

function RouteManager() {
	this.routes = [];
}

RouteManager.prototype.matchRoute = function(path) {
	if (path instanceof http.IncomingMessage) {
		path = url.parse(path.url, false).path;
	}
	for ( var index = 0; index < this.routes.length; ++index) {
		if (this.routes[index].matches(path)) {
			return this.routes[index].controller;
		}
	}
	return null;
};

RouteManager.prototype.addRoute = function(pattern, controller) {
	if (pattern instanceof route.Route) {
		this.routes[this.routes.length] = pattern;
	} else {
		this.routes[this.routes.length] = route.Route.create(pattern, controller);
	}

	console.log('Added route %s with %s', pattern, controller.name ? controller.name : controller.constructor.name);
};

function Application(options) {
	this.routeManager = new RouteManager();
	this.filterManager = new FilterManager();
	this.options = options || {};
	
	this.eventManager = new events.EventEmitter();
}

Application.handleEvent = function(req, res, event) {
	if ( req === undefined || res === undefined ) {
		return;
	}
	
	res.statusCode = event.statusCode;
	if ( event.headers !== undefined ) {
		res.writeHead(res.statusCode, event.headers);		
	}
	res.write(event.data);
	res.end();

	console.log('[%s:%d] %s: responding with %d', req.connection.remoteAddress,
			req.connection.remotePort, req.url, res.statusCode);
};

Application.handleData = function(req, res, event) {
	if ( event.statusCode === undefined ) {
		event.statusCode = 200;
	}

	if ( event.data === undefined ) {
		event.data = '\n';
	}
	
	Application.handleEvent(req, res, event);
};

Application.handleError = function(req, res, event) {
	if ( event.statusCode === undefined ) {
		event.statusCode = 500;
	}

	if ( event.data === undefined ) {
		event.data = 'An error has occurred while processing this request.\n\n' + req.url + '\n\n' + event.statusCode + ' ' + http.STATUS_CODES[event.statusCode] + '\n';
	}
	Application.handleEvent(req, res, event);
};

Application.prototype.requestHandler = function(req, res) {
	console.log('Request from %s:%d', req.connection.remoteAddress,
			req.connection.remotePort);
	
	for ( var index = 0; index < this.filterManager.filters.length; ++index ) {
		req = this.filterManager.filters[index](req, res);
	}
	if ( req === undefined ) {
		res.end();
		return;
	}

	var controller = this.routeManager.matchRoute(req);
	console.log('Controller for %s is %s', req.url, controller.name ? controller.name : controller.constructor.name);
	if (controller !== undefined) {
		if ( controller instanceof events.EventEmitter ) {
			if (!controller.bound) {
				console.log('Listening to data and error controller events for %s', controller.constructor.name);
				controller.on('data', Application.handleData);
				controller.on('error', Application.handleError);
				controller.bound = true;
			}
			controller.requestHandler(req, res);
		} else {
			controller(req, res, this.eventManager);
		}
	} else {
		res.writeHead(500, {'Content-Type': 'text/plain'});
		res.write(http.STATUS_CODES['500']);
		res.end();
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

exports.Route = route.Route;
exports.Controller = controller.Controller;
exports.Application = Application;
