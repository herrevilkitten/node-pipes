var http = require('http');
var util = require('util');
var url = require('url');
var events = require('events');
var logger = require('./emf.logger');

var route = require('./emf.route');
var controller = require('./emf.controller');
var routeManager = require('./emf.routemanager');

function FilterManager() {
		this.filters = [];
}

FilterManager.prototype.addFilter = function(filter) {
	this.filters[this.filters.length] = filter;
};

function Application(options) {
	this.options = options || {};

	this.routes = new routeManager.RouteManager();
	this.filterManager = new FilterManager();
	this.eventManager = new events.EventEmitter();
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

Application.prototype.requestHandler = function(req, res) {
	logger.info(req, 'New request');

	for ( var index = 0; index < this.filterManager.filters.length; ++index) {
		req = this.filterManager.filters[index](req, res);
		if (req === undefined) {
			res.end();
			return;
		}
	}

	var controller = this.routes.matchRoute(req);
	if (controller !== undefined && controller !== null) {
		logger.info(req, 'Controller is %s',
				controller.name ? controller.name : controller.constructor.name);
		res.setTimeout(this.options.timeout || 5000, function() {
			Application.handleError(req, res, {
				data : 'Request timed out'
			});
		});
		if (controller instanceof events.EventEmitter) {
			if (!controller.bound) {
				logger.info('Listening to data and error controller events for %s',
						controller.constructor.name);
				controller.on('data', Application.handleData);
				controller.on('error', Application.handleError);
				controller.bound = true;
			}
			controller.requestHandler(req, res);
		} else {
			controller(req, res, this.eventManager);
		}
	} else {
		logger.error(req, 'No controller available to request');
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
	http.createServer(onRequest).listen(listenPort, listenAddress);
	logger.info('Application listening on %s:%d', listenAddress, listenPort);
};

exports.Route = route.Route;
exports.Controller = controller.Controller;
exports.Application = Application;
