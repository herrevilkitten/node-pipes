var http = require('http');
var util = require('util');
var url = require('url');
var events = require('events');

var logger = require('./lib/logger');
var pipe = require('./lib/pipe');
var route = require('./lib/route');
var error = require('./lib/error');

function Main(options) {
	this.options = options || {};

	this.routes = route.create(route.methods.ALL, '');
	this.http = null;
	this.io = null;
}
util.inherits(Main, events.EventEmitter);

var PARAMETER_INDEX = /param(?:eter)_(\w+)/i;
var REQUEST_INDEX = /req(?:uest)_(\w+)/i;
function processPipe(event) {
	var pipe = event.pipes.shift();
	var pipeflow = event.state;
	var req = pipeflow.request;
	var res = pipeflow.response;
	var state = pipeflow.state;
	var route = pipeflow.route;
	var main = pipeflow.main;

	logger.debug(req, 'Pipe is %s', pipe.name ? pipe.name : pipe.constructor.name);

	var parameters = [];
	if (pipe.parameters) {
		for ( var index = 0; index < pipe.parameters.length; ++index) {
			var parameter = pipe.parameters[index];
			var matches;
			if (parameter === 'req' || parameter === 'request') {
				parameters.push(req);
			} else if (parameter === 'res' || parameter === 'response') {
				parameters.push(res);
			} else if (parameter === 'pipe') {
				parameters.push(pipe);
			} else if (parameter === 'params' || parameter === 'parameters') {
				parameters.push(route.parameters);
			} else if (parameter === 'state') {
				parameters.push(state);
			} else if (parameter === 'route') {
				parameters.push(route);
			} else if (parameter === 'args') {
				parameters.push(pipe.args);
			} else if (parameter === 'event') {
				parameters.push(event);
			} else if ((matches = parameter.match(PARAMETER_INDEX)) !== null) {
				parameters.push(route.parameters[matches[1]]);
			} else if ((matches = parameter.match(REQUEST_INDEX)) !== null) {
				parameters.push(req.parameters[matches[1]]);
			} else {
				if (pipe.args[parameter]) {
					parameters.push(pipe.args[parameter]);
				} else if (state[parameter]) {
					parameters.push(state[parameter]);
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

	try {
		var rc = pipe.apply(null, parameters);
		if ((rc !== undefined && rc === false) || event.pipes.length === 0) {
			event.emit('done');
			main.emit('done', pipeflow);
		} else {
			event.next();
			main.emit('next', pipeflow);
		}
	} catch (e) {
		logger.error('Exception during pipe:', util.inspect(e));
		if (e.stack !== undefined) {
			logger.error(e.stack);
		}
		event.emit('error', pipeflow, e);
		main.emit('error', pipeflow, e);
		return;
	}
}

Main.prototype.requestHandler = function(req, res) {
	logger.info(req, 'New request');

	var requestUrl = url.parse(req.url, true);
	req.parameters = requestUrl.query;

	/*
	 * The state object allows pipes to pass data down the line
	 */
	var state = {};

	/*
	 * The event object allows asynchronous and OOB communication between the
	 * framework and pipes
	 */
	var event = new events.EventEmitter();

	/*
	 * Find the route that matches this request
	 */
	var route = this.routes.matches(req);

	if (route !== undefined && route !== null) {
		var pipeflow = {
			request : req,
			response : res,
			state : state,
			event : event,
			route : route,
			main : this
		};
		event.pipes = route.pipes;
		event.state = pipeflow;
		event.next = function() {
			this.emit('next');
		};

		event.error = function(e) {
			this.emit('error', e);
		};

		event.on('error', function(pipeflow, e) {
			pipe.sendError(e.statusCode, e.statusMessage, req, res);
		});

		event.on('next', function() {
			processPipe(event);
		});

		res.setTimeout(this.options.timeout || 5000, function() {
			event.error(new error.HttpError(500, 'Request timed out.'));
		});

		event.next();
	} else {
		logger.error(req, 'No pipe available for request');
		res.writeHead(500, {
			'Content-Type' : 'text/plain'
		});
		res.write(http.STATUS_CODES['500']);
		res.end();
	}
};

Main.prototype.start = function() {
	var main = this;
	var listenPort = this.options.listenPort;
	var listenAddress = this.options.listAddress || http.INADDR_ANY;
	
	if ( listenPort === null || listenPort === undefined ) {
		throw new error.Error('Missing listenPort option');
	}

	function onRequest(req, res) {
		Main.prototype.requestHandler.call(main, req, res);
	}

	this.httpServer = http.createServer(onRequest);
	this.emit('init');

	this.httpServer.listen(listenPort, listenAddress);
	this.emit('listen');

	logger.info('Pipes listening on %s:%d', listenAddress, listenPort);
};

Main.route = route;
Main.logger = logger;
Main.pipe = pipe;
Main.error = error;

module.exports = Main;
