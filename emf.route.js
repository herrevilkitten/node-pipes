var
	http = require('http'),
	util = require('util'),
	url = require('url')
	;

var logger = require('./emf.logger');

/*
 * Create a new Route object by examining the route
 * and choosing the "best" match.
 */
function create(route, controller, parameters) {
	var routeObject = null;
	if ( util.isRegExp(route) ) {
		logger.info('Already a RegExpRoute');
		routeObject = new RegExpRoute(route, controller, parameters);
	} else if ( route.indexOf('*') > -1 || route.indexOf('?') > -1 ) {
		/*
		 * If it has a * or ?, it is a GlobRoute
		 */
		routeObject = new GlobRoute(route, controller, parameters);
	} else if ( route.match(/[:=]\w+/g) ) {
			/*
		 * If it has :\w+ or =\w+, it is a NamedRoute
		 */
		routeObject = new NamedRoute(route, controller, parameters);
	} else {
		/*
		 * Otherwise, assume it is a RegExpRoute
		 */
		routeObject = new RegExpRoute(route, controller, parameters);
	}
	
	return routeObject;
}

/*
 * RegExp route: /path\/(.+)/
 * - Matched groups become controller parameters
 * - Parameters passed to controller as array
 */
function RegExpRoute(route, controller, parameters) {
	this.regexp = null;
	this.pattern = route;
	this.controller = controller;
	this.routes = [];
	this.parameters = parameters || [];
	if ( util.isRegExp(route) ) {
		this.regexp = route;
	} else {
		this.regexp = new RegExp('^' + route + '$');
	}
}

RegExpRoute.prototype.matches = function(url) {
	var results = this.regexp.exec(url);
	if ( results === null ) {
		return results;
	}
	
	var map = {
		input: url,
		parameters: {}
	};
	for ( var index = 1; index < results.length; ++index ) {
		if ( this.parameters.length > 0 ) {
			map.parameters[this.parameters[index - 1]] = results[index];
		}
		map.parameters[index - 1] = results[index]; 
	}
	map.parameterCount = Object.keys(map.parameters).length;
	return map;
};


/*
 * Static route: '/path'
 * - No parameters
 */
function StaticRoute(route, controller) {
	RegExpRoute.call(this, route, controller);
}
util.inherits(StaticRoute, RegExpRoute);

/*
 * Glob route: '/path/*'
 * - Rewritten to be a RegExp:
 *   ? becomes (.)
 *   * becomes (.*)
 */
function GlobRoute(route, controller, parameters) {
	/*
	 * Convert the glob into a regular expression
	 */
	var pattern = route;
	route = route.replace(/\?/g, '(.)').replace(/\*\*?/g, function(match) {
		if ( match === '**' ) { return '(.*)'; } else { return '([^/]*)'; }
	});
	RegExpRoute.call(this, route, controller, parameters);
	this.pattern = pattern;
}
util.inherits(GlobRoute, RegExpRoute);

/*
 * Named Glob route: '/account/:id'
 * - Rewritten to be a Glob:
 *   :[^/]+ becomes *
 */
var NAMED_ROUTE_PATTERN = /[:=](\w+)/g;
var OPTIONAL_NAMED_ROUTE_PATTERN = /:(\w+)/g;
var REQUIRED_NAMED_ROUTE_PATTERN = /=(\w+)/g;
function NamedRoute(route, controller) {
	/*
	 * Save the parameter names for the hash later
	 */
	var parameters = [];
	var namedParams = route.match(NAMED_ROUTE_PATTERN);
	if ( namedParams ) {
		for ( var index = 0; index < namedParams.length; ++index ) {
			parameters[index] = namedParams[index].substring(1);
		}
	}
	/*
	 * Convert the named route into a regular expression
	 */
	route = route.replace(REQUIRED_NAMED_ROUTE_PATTERN, '(.+)').replace(OPTIONAL_NAMED_ROUTE_PATTERN, '(.*)');
	RegExpRoute.call(this, route, controller, parameters);
}
util.inherits(NamedRoute, RegExpRoute);

NamedRoute.prototype.matches = function(url) {
	var map = NamedRoute.super_.prototype.matches.call(this, url);
	if ( map === null ) {
		return map;
	}
	
	var parameterMap = {};
	for ( var index = 0; index < this.parameters.length; ++index ) {
		var key = this.parameters[index];
		var value = map.parameters[index];
		parameterMap[key] = value;
	}
	map.parameters = parameterMap;
	return map;
};

exports.RegExp = RegExpRoute;
exports.Static = StaticRoute;
exports.Glob = GlobRoute;
exports.Named = NamedRoute;
exports.create = create;
