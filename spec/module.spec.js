describe('Loading modules:', function() {
	it('emf.module', function() {
		var module = require('../emf.route.js');
		expect(module).toNotEqual(undefined);
	});

	it('emf.controller', function() {
		var module = require('../emf.controller.js');
		expect(module).toNotEqual(undefined);
	});

	it('emf.mime', function() {
		var module = require('../emf.mime.js');
		expect(module).toNotEqual(undefined);
	});

	it('emf.session', function() {
		var module = require('../emf.session.js');
		expect(module).toNotEqual(undefined);
	});

	it('emf', function() {
		var module = require('../emf.js');
		expect(module).toNotEqual(undefined);
	});
});