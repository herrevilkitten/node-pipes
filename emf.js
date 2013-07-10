var http = require('http');
var util = require('util');
var url = require('url');
var events = require('events');
var cookie = require('tough-cookie').Cookie;
var logger = require('./emf.logger');

var controller = require('./emf.controller');

var route = require('./emf.route');

function Application(options) {
	this.options = options || {};

	this.routes = route.create('GET', '');
	this.events = new events.EventEmitter();
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
		event.data = 'An error has occurred while processing this request.\n\n' + req.url + '\n\n'
				+ event.statusCode + ' ' + http.STATUS_CODES[event.statusCode] + '\n';
	}
	Application.handleEvent(req, res, event);
};

var PARAMETER_INDEX = /param(?:eter)_(\w+)/i;
var REQUEST_INDEX = /req(?:uest)_(\w+)/i;
Application.prototype.requestHandler = function(req, res) {
	res.setTimeout(this.options.timeout || 5000, function() {
		Application.handleError(req, res, {
			data : 'Request timed out'
		});
	});

	logger.info(req, 'New request');

	var requestUrl = url.parse(req.url, true);
	req.parameters = requestUrl.query;

	/*
	 * The model object allows controllers to pass data down the line
	 */
	var model = {};

	/*
	 * The event object allows asynchronous and OOB communication between the
	 * framework and controllers
	 */
	var event = new events.EventEmitter();
	var route = this.routes.matches(req);
	if (route !== undefined && route !== null) {
		for ( var ci = 0; ci < route.controllers.length; ++ci) {
			var controller = route.controllers[ci];
			logger.info(req, 'Controller is %s', controller.name ? controller.name
					: controller.constructor.name);

			var parameters = [];
			if (controller.parameters) {
				for ( var index = 0; index < controller.parameters.length; ++index) {
					var parameter = controller.parameters[index];
					var matches;
					if (parameter === 'req' || parameter === 'request') {
						parameters.push(req);
					} else if (parameter === 'res' || parameter === 'response') {
						parameters.push(res);
					} else if (parameter === 'controller') {
						parameters.push(controller);
					} else if (parameter === 'params' || parameter === 'parameters') {
						parameters.push(route.parameters);
					} else if (parameter === 'model') {
						parameters.push(model);
					} else if (parameter === 'args') {
						parameters.push(controller.args);
					} else if (parameter === 'event') {
						parameters.push(event);
					} else if ((matches = parameter.match(PARAMETER_INDEX)) !== null) {
						parameters.push(parameters[matches[1]]);
					} else if ((matches = parameter.match(REQUEST_INDEX)) !== null) {
						parameters.push(req.parameters[matches[1]]);
					} else {
						/*
						 * Look up the name in the following order: - Model - Route
						 * parameters - Request parameters - Session parameters - Method
						 * 'args' if it's an object-type - null if not found
						 */
						if (controller.args[parameter]) {
							parameters.push(controller.args[parameter]);
						} else if (model[parameter]) {
							parameters.push(model[parameter]);
						} else if (route.parameters[parameter]) {
							parameters.push(route.parameters[parameter]);
						} else if (req.parameters[parameter]) {
							parameters.push(req.parameters[parameter]);
						} else {
							parameters.push(null);
						}
					}
				}
			}
			var rc = controller.apply(this, parameters);
			if (rc === false) {
				break;
			}
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

exports.Route = require('./emf.route');
exports.Controller = controller.Controller;
exports.Application = Application;
