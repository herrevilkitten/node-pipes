var
	http = require('http'),
	util = require('util'),
	url = require('url')
	;

function Route(route, controller) {
	this.route = route;
	this.controller = controller;
}

Route.prototype.matches = function(url) {
	return {input: url, parameterCount: 0, parameters: {}};
};

/*
 * Create a new Route object by examining the route
 * and choosing the "best" match.
 */
Route.create = function(route, controller) {
	var routeObject = null;
	if ( util.isRegExp(route) ) {
		routeObject = new RegExpRoute(route, controller);
	} else if ( route.indexOf('*') > -1 || route.indexOf('?') > -1 ) {
		/*
		 * If it has a * or ?, it is a GlobRoute
		 */
		routeObject = new GlobRoute(route, controller);
	} else if ( route.match(/:\w+/g) ) {
		/*
		 * If it has :\w+, it is a NamedRoute
		 */
		routeObject = new NamedRoute(route, controller);
	} else {
		/*
		 * Otherwise, assume it is a RegExpRoute
		 */
		routeObject = new RegExpRoute(route, controller);
	}
	
	return routeObject;
};

/*
 * Static route: '/path'
 * - No parameters
 */
function StaticRoute(route, controller) {
	Route.call(this, route, controller);
}
util.inherits(StaticRoute, Route);

StaticRoute.prototype.matches = function(url) {
	return url === this.route ? StaticRoute.super_.prototype.matches.call(this, url) : null;
};

/*
 * RegExp route: /path\/(.+)/
 * - Matched groups become controller parameters
 * - Parameters passed to controller as array
 */
function RegExpRoute(route, controller) {
	Route.call(this, route, controller);
	if ( util.isRegExp(route) ) {
		this.regexp = route;
	} else {
		this.regexp = new RegExp(route);
	}
}
util.inherits(RegExpRoute, Route);

RegExpRoute.prototype.matches = function(url) {
	var results = this.regexp.exec(url);
	if ( results === null ) {
		return results;
	}
	
	var map = {
		input: url,
		parameters: []
	};
	for ( var index = 1; index < results.length; ++index ) {
		map.parameters[index - 1] = results[index]; 
	}
	map.parameterCount = Object.keys(map.parameters).length;
	return map;
};

/*
 * Glob route: '/path/*'
 * - Rewritten to be a RegExp:
 *   ? becomes (.)
 *   * becomes (.*)
 */
function GlobRoute(route, controller) {
	Route.call(this, route, controller);
	/*
	 * Convert the glob into a regular expression
	 */
	var regexpStr = this.route.replace(/\?/g, '([^/])').replace(/\*/g, '([^/]*)');
	this.regexp = new RegExp(regexpStr);
}
util.inherits(GlobRoute, RegExpRoute);

/*
 * Named Glob route: '/account/:id'
 * - Rewritten to be a RegExp:
 *   :\w+ becomes (\w+)
 */
var NAMED_ROUTE_PATTERN = /:(\w+)/g;
function NamedRoute(route, controller) {
	Route.call(this, route, controller);
	this.parameters = [];
	/*
	 * Save the parameter names for the hash later
	 */
	var namedParams = this.route.match(NAMED_ROUTE_PATTERN);
	if ( namedParams ) {
		for ( var index = 0; index < namedParams.length; ++index ) {
			this.parameters[index] = namedParams[index].substring(1);
		}
	}
	/*
	 * Convert the named route into a regular expression
	 */
	var regexpStr = this.route.replace(NAMED_ROUTE_PATTERN, '([^/]*)');
	this.regexp = new RegExp(regexpStr);
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

exports.Route = Route;
exports.StaticRoute = StaticRoute;
exports.RegExpRoute = RegExpRoute;
exports.GlobRoute = GlobRoute;
exports.NamedRoute = NamedRoute;
