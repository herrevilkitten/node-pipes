var http = require('http');
var util = require('util');
var url = require('url');
var events = require('events');
var logger = require('./emf.logger');

var route = require('./emf.route');
var controller = require('./emf.controller');
var routeManager = require('./emf.routemanager');

function Application(options) {
	this.options = options || {};

	this.routes = new routeManager.RouteManager();
	this.eventManager = new events.EventEmitter();
	this.httpServer = null;
	this.ioServer = null;
}

Application.handleEvent = function(req, res, event) {
	event = event || {};
	if (req === undefined || res === undefined) {
		return;
	}

	res.statusCode = event.statusCode;
	if (event.headers !== undefined) {
		res.writeHead(res.statusCode, event.headers);
	}
	res.write(event.data);
	res.end();

	logger.info(req, 'responding with %d', res.statusCode);
};

Application.handleData = function(req, res, event) {
	event = event || {};
	if (event.statusCode === undefined) {
		event.statusCode = 200;
	}

	if (event.data === undefined) {
		event.data = '\n';
	}

	Application.handleEvent(req, res, event);
};

Application.handleError = function(req, res, event) {
	event = event || {};
	if (event.statusCode === undefined) {
		event.statusCode = 500;
	}

	if (event.data === undefined) {
		event.data = 'An error has occurred while processing this request.\n\n'
				+ req.url + '\n\n' + event.statusCode + ' '
				+ http.STATUS_CODES[event.statusCode] + '\n';
	}
	Application.handleEvent(req, res, event);
};

var PARAMETER_INDEX = /param(?:eter)_?(\w+)/i;
var REQUEST_INDEX = /req(?:uest)_?(\w+)/i;
var SESSION_INDEX = /ses(?:sion)_?(\w+)/i;
Application.prototype.requestHandler = function(req, res) {
	res.setTimeout(this.options.timeout || 5000, function() {
		Application.handleError(req, res, {
			data : 'Request timed out'
		});
	});

	req.parameters = {};
	logger.info(req, 'New request');

	var result = this.routes.matchRoute(req);
	if (result !== undefined && result !== null) {
		console.error(result);
		for (var ci = 0; ci < result.controllers.length; ++ci ) {
			var controller = result.controllers[ci];
			logger.info(req, 'Controller is %s',
					controller.name ? controller.name : controller.constructor.name);
			
			var parameters = [];
			for ( var index = 0; index < controller.parameters.length; ++index ) {
				var parameter = controller.parameters[index];
				var matches;
				if ( parameter === 'req' || parameter === 'request' ) {
					parameters.push(req);
				} else if ( parameter === 'res' || parameter === 'response' ) {
					parameters.push(res);
				} else if ( parameter === 'controller' ) {
					parameters.push(controller);
				} else if ( parameter === 'params' || parameter === 'parameters' ) {
					parameters.push(result.parameters);
				} else if ( (matches = parameter.match(PARAMETER_INDEX)) !== null ) {
					parameters.push(result.parameters[matches[1]]);
				} else if ( (matches = parameter.match(REQUEST_INDEX)) !== null ) {
					parameters.push(req.parameters[matches[1]]);
				} else {
					/*
					 * Look up the parameter name in the following order:
					 * - Route parameter list
					 * - Request parameters
					 * - Session parameters
					 * - Set to null if now found
					 */
					console.error('Looking up %s', parameter);
					console.error(result.parameters);
					console.error(req.parameters);
					if ( result.parameters[parameter] ) {
						console.error('Parameter is %s', result.parameters[parameter]);
						parameters.push(result.parameters[parameter]);
					} else if ( req.parameters[parameter] ) {
						console.error('Request parameter is %s', req.parameters[parameter]);
						parameters.push(req.parameters[parameter]);						
					} else {
						parameters.push(null);						
					}
				}
			}
			controller.apply(this, parameters);
			
		}
	} else {
		logger.error(req, 'No controller available for request');
		res.writeHead(500, {
			'Content-Type' : 'text/plain'
		});
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
	this.httpServer = http.createServer(onRequest).listen(listenPort, listenAddress);
	logger.info('Application listening on %s:%d', listenAddress, listenPort);
};

exports.Route = route.Route;
exports.Controller = controller.Controller;
exports.Application = Application;
