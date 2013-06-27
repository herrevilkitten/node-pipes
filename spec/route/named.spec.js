var route = require('../../emf.route.js');
expect(route).toNotEqual(undefined);

describe('Named routes:', function() {
	it('Testing static route', function() {
		var namedRoute = new route.Route.Named('/test', 'controller');
		expect(namedRoute.matches('/test')).toEqual({input: '/test', parameterCount: 0, parameters: {}});
		expect(namedRoute.matches('/test/route/failure')).toBeNull();
	});
	
	it('Testing single optional parameter route', function() {
		var namedRoute = new route.Route.Named('/:id', 'controller');
		expect(namedRoute.matches('/')).toEqual({input: '/', parameterCount: 1, parameters: {id: ''}});
		expect(namedRoute.matches('/test')).toEqual({input: '/test', parameterCount: 1, parameters: {id: 'test'}});
		expect(namedRoute.matches('/test/id')).toEqual({input: '/test/id', parameterCount: 1, parameters: {id: 'test/id'}});
		expect(namedRoute.matches('')).toBeNull();
	});
	
	it('Testing multiple parameter route', function() {
		var namedRoute = new route.Route.Named('/:entity/:id', 'controller');
		expect(namedRoute.matches('/entity/id')).toEqual({input: '/entity/id', parameterCount: 2, parameters: {entity: 'entity', id: 'id'}});
		expect(namedRoute.matches('/entity/')).toEqual({input: '/entity/', parameterCount: 2, parameters: {entity: 'entity', id: ''}});
		expect(namedRoute.matches('/entity')).toBeNull();
	});
});