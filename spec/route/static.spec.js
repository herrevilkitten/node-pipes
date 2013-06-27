var route = require('../../emf.route.js');
expect(route).toNotEqual(undefined);

describe('Static routes:', function() {
	it('Testing static route', function() {
		var staticRoute = new route.Route.Static('/test', 'controller');
		expect(staticRoute.matches('/test')).toEqual({input: '/test', parameterCount: 0, parameters: {}});
		expect(staticRoute.matches('/test/route/failure')).toBeNull();
	});
});