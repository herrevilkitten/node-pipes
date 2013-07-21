var http = require('http');
var util = require('util');
var url = require('url');

var logger = require('./logger');
var GET = 0x01;
var HEAD = 0x02;
var POST = 0x04;
var PUT = 0x08;
var DELETE = 0x10;

exports.methods = {
	'GET' : GET,
	'HEAD' : HEAD,
	'POST' : POST,
	'PUT' : PUT,
	'DELETE' : DELETE,
	'ALL': GET | HEAD | POST | PUT | DELETE
};

function methodList(bits) {
	var method = [];
	if ( bits & GET ) {
		method.push('GET');
	}

	if ( bits & HEAD ) {
		method.push('HEAD');
	}

	if ( bits & POST ) {
		method.push('POST');
	}

	if ( bits & PUT ) {
		method.push('PUT');
	}

	if ( bits & DELETE ) {
		method.push('DELETE');
	}
	
	return method.join(', ');
}

/*
 * Create a new Route object by examining the route and choosing the "best"
 * match.
 */
function create(method, pattern, parameters) {
	var routeObject = null;
	method = method || GET;
	if ( util.isArray(method) ) {
		method = method.reduce(function(prev, curr) {
			return prev | curr;
		});
	}
	if (util.isRegExp(pattern)) {
		routeObject = new RegExpRoute(method, pattern, parameters);
	} else if (pattern.indexOf('*') > -1 || pattern.indexOf('?') > -1) {
		/*
		 * If it has a * or ?, it is a GlobRoute
		 */
		routeObject = new GlobRoute(method, pattern, parameters);
	} else if (pattern.match(/[:=]\w+/g)) {
		/*
		 * If it has :\w+ or =\w+, it is a NamedRoute
		 */
		routeObject = new NamedRoute(method, pattern, parameters);
	} else {
		/*
		 * Otherwise, assume it is a RegExpRoute
		 */
		routeObject = new RegExpRoute(method, pattern, parameters);
	}

	return routeObject;
}

/*
 * RegExp route: /path\/(.+)/ - Matched groups become route parameters -
 * Parameters passed to route as array
 */
function RegExpRoute(method, pattern, parameters) {
	this.method = (method || GET);
	this.regexp = null;
	this.pattern = pattern;
	this.pipes = [];
	this.postPipes = [];
	this.routes = [];
	this.parameterNames = [];
	this.parent = null;
	if (parameters !== null && parameters !== undefined) {
		this.parameterNames = parameters;
	}
	if (util.isRegExp(pattern)) {
		this.pattern = pattern.toString();
		this.regexp = pattern;
	} else {
		this.regexp = new RegExp('^' + pattern + '$');
	}

	logger.info('Created route %s %s', methodList(method), pattern);
}

var SIGNATURE_REGEXP = /^function\s*\w*\((.*)\)/i;
RegExpRoute.prototype.to = function(pipe, args, parameters) {
	if (pipe !== undefined && pipe !== null) {
		pipe.parameters = [];
		this.pipes.push(pipe);
		var logString = util.format('To %s', pipe.name ? pipe.name
				: pipe.constructor.name);
		if (parameters !== null && parameters !== undefined) {
			pipe.parameters = parameters;
		} else {
			var signature = pipe.toString();
			var matches = SIGNATURE_REGEXP.exec(signature);
			if (matches !== null) {
				pipe.parameters = matches[1].split(/\s*,\s*/g);
			} else {
				pipe.parameters = [];
			}
			logString += util.format(' with parameters %s', pipe.parameters);
		}

		if (args !== null && args !== undefined) {
			pipe.args = args;
			logString += util.format(' with arguments %s', pipe.args);
		} else {
			pipe.args = [];
		}

		logger.info(logString);
	}

	
	return this;
};

RegExpRoute.prototype.then = function(pipe, args, parameters) {
	if (pipe !== undefined && pipe !== null) {
		pipe.parameters = [];
		this.postPipes.push(pipe);
		var logString = util.format('Then %s', pipe.name ? pipe.name
				: pipe.constructor.name);
		if (parameters !== null && parameters !== undefined) {
			pipe.parameters = parameters;
		} else {
			var signature = pipe.toString();
			var matches = SIGNATURE_REGEXP.exec(signature);
			if (matches !== null) {
				pipe.parameters = matches[1].split(/\s*,\s*/g);
			} else {
				pipe.parameters = [];
			}
			logString += util.format(' with parameters %s', pipe.parameters);
		}

		if (args !== null && args !== undefined) {
			pipe.args = args;
			logString += util.format(' with arguments %s', pipe.args);
		} else {
			pipe.args = [];
		}

		logger.info(logString);
	}

	
	return this;
};

RegExpRoute.prototype.root = function() {
	if ( this.parent === null ) {
		return this;
	}
	return this.parent.root();
};

RegExpRoute.prototype.parameters = function(parameters) {
	if (parameters !== null && parameters !== undefined) {
		if (util.isArray(parameters)) {
			this.parameterNames = parameters;
		} else {
			this.parameterNames = Array.prototype.slice.call(arguments);
		}
	} else {
		this.parameterNames = [];
	}
	return this;
};

RegExpRoute.prototype.add = function(method, pattern, parameters) {
	var completePattern = this.pattern + pattern;
	method = (method || route.methods.GET);
	var rte = create(method, completePattern, parameters);
	this.routes.push(rte);

	if (parameters !== null && parameters !== undefined) {
		rte.parameters(parameters);
	}

	rte.parent = this;
	return rte;
};

/*
 * Create helper methods for each of the HTTP methods
 */
for ( var method in exports.methods) {
	(function(m) {
		RegExpRoute.prototype[m.toLowerCase()] = function(pattern, parameters) {
			return this.add(exports.methods[m.toUpperCase()], pattern, parameters);
		};
	})(method);
}

RegExpRoute.prototype.all = function(pattern, parameters) {
	return this.add(exports.methods.ALL, pattern, parameters);
};

RegExpRoute.prototype.matches = function(method, path) {
	var results;
	var index;

	if (method instanceof http.IncomingMessage) {
		path = url.parse(method.url, false).path;
		method = method.method;
	}
	method = method.toUpperCase();

	if (this.routes.length > 0) {
		for (index = 0; index < this.routes.length; ++index) {
			var subroute = this.routes[index];
			results = subroute.matches(method, path);
			if (results !== null && results !== undefined) {
				results.pipes = this.pipes.concat(results.pipes).concat(this.postPipes);
				return results;
			}
		}
		return null;
	}

	results = this.regexp.exec(path);
	if (results === null) {
		return results;
	}

	var map = {
		route : this,
		pipes : this.pipes.concat(this.postPipes),
		input : url,
		parameters : {}
	};

	for (index = 1; index < results.length; ++index) {
		if (this.parameterNames.length > 0) {
			map.parameters[this.parameterNames[index - 1]] = results[index];
		}
		map.parameters[index - 1] = results[index];
	}
	map.parameterCount = Object.keys(map.parameters).length;
	return map;
};

/*
 * Glob route: '/path/*' - Rewritten to be a RegExp: ? becomes (.) * becomes
 * (.*)
 */
function GlobRoute(method, pattern, parameters) {
	/*
	 * Convert the glob into a regular expression
	 */
	var original = pattern;
	pattern = pattern.replace(/\?/g, '(.)').replace(/\*\*?/g, function(match) {
		if (match === '**') {
			return '(.*)';
		} else {
			return '([^/]*)';
		}
	});
	RegExpRoute.call(this, method, pattern, parameters);
	this.pattern = original;
}
util.inherits(GlobRoute, RegExpRoute);

/*
 * Named Glob route: '/account/:id' - Rewritten to be a Glob: :[^/]+ becomes *
 */
var NAMED_ROUTE_PATTERN = /([:=]\w+)/g;
function NamedRoute(method, pattern, pipe) {
	/*
	 * Save the parameter names for the hash later
	 */
	var parameters = [];
	var namedParams = pattern.match(NAMED_ROUTE_PATTERN);
	if (namedParams) {
		for ( var index = 0; index < namedParams.length; ++index) {
			parameters[index] = namedParams[index].substring(1);
		}
	}
	/*
	 * Convert the named route into a regular expression
	 */
	var original = pattern;
	pattern = pattern.replace(NAMED_ROUTE_PATTERN, function(match) {
		if (match[0] === ':') {
			return '(.*)';
		} else {
			return '(.+)';
		}
	});
	RegExpRoute.call(this, method, pattern, parameters);
	this.pattern = original;
}
util.inherits(NamedRoute, RegExpRoute);

exports.RegExp = RegExpRoute;
exports.Glob = GlobRoute;
exports.Named = NamedRoute;
exports.create = create;
