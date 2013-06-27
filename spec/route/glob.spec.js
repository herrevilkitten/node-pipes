var route = require('../../emf.route.js');
expect(route).toNotEqual(undefined);

describe('Glob routes:', function() {
	it('Testing static route', function() {
		var globRoute = new route.Route.Glob('/test', 'controller');
		expect(globRoute.matches('/test')).toEqual({input: '/test', parameterCount: 0, parameters: {}});
		expect(globRoute.matches('/test/route/failure')).toBeNull();
	});

	it('Testing single wildcard parameter route', function() {
		var globRoute = new route.Route.Glob('/*', 'controller');
		expect(globRoute.matches('/test')).toEqual({input: '/test', parameterCount: 1, parameters: {0: 'test'}});
		expect(globRoute.matches('/test/route/failure')).toEqual({input: '/test/route/failure', parameterCount: 1, parameters: {0: 'test/route/failure'}});
		expect(globRoute.matches('/')).toEqual({input: '/', parameterCount: 1, parameters: {0: ''}});
		expect(globRoute.matches('')).toBeNull();
	});
	
	it('Testing single wildcard parameter route with static end', function() {
		var globRoute = new route.Route.Glob('/*/end', 'controller');		
		expect(globRoute.matches('/test/end')).toEqual({input: '/test/end', parameterCount: 1, parameters: {0: 'test'}});
		expect(globRoute.matches('/test 1234/end')).toEqual({input: '/test 1234/end', parameterCount: 1, parameters: {0: 'test 1234'}});
		expect(globRoute.matches('/test/end/')).toBeNull();
	});
	
	it('Testing multiple wildcard parameter route', function() {
		var globRoute = new route.Route.Glob('/*/*', 'controller');		
		expect(globRoute.matches('/test/1')).toEqual({input: '/test/1', parameterCount: 2, parameters: {0: 'test', 1: '1'}});
		expect(globRoute.matches('//1')).toEqual({input: '//1', parameterCount: 2, parameters: {0: '', 1: '1'}});
		expect(globRoute.matches('/test/')).toEqual({input: '/test/', parameterCount: 2, parameters: {0: 'test', 1: ''}});
		expect(globRoute.matches('//')).toEqual({input: '//', parameterCount: 2, parameters: {0: '', 1: ''}});
		expect(globRoute.matches('/')).toBeNull();
		expect(globRoute.matches('/test')).toBeNull();		
	});

	it('Testing multiple wildcard parameter route with static portion', function() {
		var globRoute = new route.Route.Glob('/*/middle/*', 'controller');		
		expect(globRoute.matches('/test/middle/1')).toEqual({input: '/test/middle/1', parameterCount: 2, parameters: {0: 'test', 1: '1'}});
		expect(globRoute.matches('//middle/1')).toEqual({input: '//middle/1', parameterCount: 2, parameters: {0: '', 1: '1'}});
		expect(globRoute.matches('/test/middle/')).toEqual({input: '/test/middle/', parameterCount: 2, parameters: {0: 'test', 1: ''}});
		expect(globRoute.matches('//middle/')).toEqual({input: '//middle/', parameterCount: 2, parameters: {0: '', 1: ''}});
		expect(globRoute.matches('/')).toBeNull();
		expect(globRoute.matches('/test')).toBeNull();		
	});

	it('Testing single character parameter route', function() {
		var globRoute = new route.Route.Glob('/?', 'controller');
		expect(globRoute.matches('/t')).toEqual({input: '/t', parameterCount: 1, parameters: {0: 't'}});
		expect(globRoute.matches('/')).toBeNull();
		expect(globRoute.matches('/te')).toBeNull();
	});
	
	it('Testing single wildcard parameter route with static end', function() {
		var globRoute = new route.Route.Glob('/?/end', 'controller');		
		expect(globRoute.matches('/t/end')).toEqual({input: '/t/end', parameterCount: 1, parameters: {0: 't'}});
		expect(globRoute.matches('//end')).toBeNull();
		expect(globRoute.matches('/test/end/')).toBeNull();
	});
	
	it('Testing multiple wildcard parameter route', function() {
		var globRoute = new route.Route.Glob('/??', 'controller');		
		expect(globRoute.matches('/te')).toEqual({input: '/te', parameterCount: 2, parameters: {0: 't', 1: 'e'}});
		expect(globRoute.matches('/t')).toBeNull();
		expect(globRoute.matches('/tes')).toBeNull();		
	});

	it('Testing multiple wildcard parameter route with static portion', function() {
		var globRoute = new route.Route.Glob('/?/middle/?', 'controller');		
		expect(globRoute.matches('/t/middle/1')).toEqual({input: '/t/middle/1', parameterCount: 2, parameters: {0: 't', 1: '1'}});
		expect(globRoute.matches('/')).toBeNull();
		expect(globRoute.matches('/middle/1')).toBeNull();		
	});

	it('Testing single character parameter route', function() {
		var globRoute = new route.Route.Glob('/?', 'controller');
		expect(globRoute.matches('/t')).toEqual({input: '/t', parameterCount: 1, parameters: {0: 't'}});
		expect(globRoute.matches('/')).toBeNull();
		expect(globRoute.matches('/te')).toBeNull();
	});
	
	it('Testing single wildcard parameter route with static end', function() {
		var globRoute = new route.Route.Glob('/?/end', 'controller');		
		expect(globRoute.matches('/t/end')).toEqual({input: '/t/end', parameterCount: 1, parameters: {0: 't'}});
		expect(globRoute.matches('//end')).toBeNull();
		expect(globRoute.matches('/test/end/')).toBeNull();
	});
	
	it('Testing mixed wildcard parameter route', function() {
		var globRoute = new route.Route.Glob('/?*', 'controller');		
		expect(globRoute.matches('/tes')).toEqual({input: '/tes', parameterCount: 2, parameters: {0: 't', 1: 'es'}});
		expect(globRoute.matches('/te')).toEqual({input: '/te', parameterCount: 2, parameters: {0: 't', 1: 'e'}});
		expect(globRoute.matches('/t')).toEqual({input: '/t', parameterCount: 2, parameters: {0: 't', 1: ''}});
		expect(globRoute.matches('/')).toBeNull();
	});

	it('Testing mixed wildcard parameter route with ending character', function() {
		var globRoute = new route.Route.Glob('/*?', 'controller');		
		expect(globRoute.matches('/tes')).toEqual({input: '/tes', parameterCount: 2, parameters: {0: 'te', 1: 's'}});
		expect(globRoute.matches('/te')).toEqual({input: '/te', parameterCount: 2, parameters: {0: 't', 1: 'e'}});
		expect(globRoute.matches('/t')).toEqual({input: '/t', parameterCount: 2, parameters: {0: '', 1: 't'}});
		expect(globRoute.matches('/')).toBeNull();
	});

	it('Testing mixed wildcard parameter route with static middle', function() {
		var globRoute = new route.Route.Glob('/*/middle/?', 'controller');		
		expect(globRoute.matches('/t/middle/1')).toEqual({input: '/t/middle/1', parameterCount: 2, parameters: {0: 't', 1: '1'}});
		expect(globRoute.matches('/t/middle/')).toBeNull();
		expect(globRoute.matches('/')).toBeNull();
		expect(globRoute.matches('/middle/1')).toBeNull();		
	});

	it('Testing mixed wildcard parameter route with static end', function() {
		var globRoute = new route.Route.Glob('/*/middle/?/end', 'controller');		
		expect(globRoute.matches('/test/middle/1/end')).toEqual({input: '/test/middle/1/end', parameterCount: 2, parameters: {0: 'test', 1: '1'}});
		expect(globRoute.matches('/test/middle//end')).toBeNull();
		expect(globRoute.matches('/')).toBeNull();
		expect(globRoute.matches('/middle/1/end')).toBeNull();		
	});
});