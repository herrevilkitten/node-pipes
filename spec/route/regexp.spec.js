var route = require('../../emf.route.js');
expect(route).toNotEqual(undefined);

describe('Regular expression routes:', function() {
	it('Testing simple static route', function() {
		var regexpRoute = new route.Route.RegExp('/test', 'controller');
		expect(regexpRoute.matches('/test')).toEqual({input: '/test', parameterCount: 0, parameters: {}});
		expect(regexpRoute.matches('/')).toBeNull();
	});

	it('Testing simple parameter route', function() {
		var regexpRoute = new route.Route.RegExp('(/.+)', 'controller');
		expect(regexpRoute.matches('/test')).toEqual({input: '/test', parameterCount: 1, parameters: {0: '/test'}});
		expect(regexpRoute.matches('/test/route/failure')).toEqual({input: '/test/route/failure', parameterCount: 1, parameters: {0: '/test/route/failure'}});
		expect(regexpRoute.matches('/')).toBeNull();
	});

	it('Testing simple parameter route with static portions', function() {
		var regexpRoute = new route.Route.RegExp('/(.+)/end', 'controller');
		expect(regexpRoute.matches('/test/end')).toEqual({input: '/test/end', parameterCount: 1, parameters: {0: 'test'}});
		expect(regexpRoute.matches('/')).toBeNull();
	});

	it('Testing multiple parameter route', function() {
		var regexpRoute = new route.Route.RegExp('/(.+)/(.+)', 'controller');
		expect(regexpRoute.matches('/test/end')).toEqual({input: '/test/end', parameterCount: 2, parameters: {0: 'test', 1: 'end'}});
		expect(regexpRoute.matches('/')).toBeNull();
	});

	it('Testing multiple parameter route with static portions', function() {
		var regexpRoute = new route.Route.RegExp('/(.+)/this/(.+)/is', 'controller');
		expect(regexpRoute.matches('/test/this/end/is')).toEqual({input: '/test/this/end/is', parameterCount: 2, parameters: {0: 'test', 1: 'end'}});
		expect(regexpRoute.matches('/')).toBeNull();
	});

	it('Testing multiple parameter route with classes', function() {
		var regexpRoute = new route.Route.RegExp('/(\\w+)/\\S+/(\\d+)', 'controller');
		expect(regexpRoute.matches('/test/this/123')).toEqual({input: '/test/this/123', parameterCount: 2, parameters: {0: 'test', 1: '123'}});
		expect(regexpRoute.matches('/test/this/123e')).toBeNull();
		expect(regexpRoute.matches('/test/ /123e')).toBeNull();
	});
});