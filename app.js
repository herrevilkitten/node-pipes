var http = require('http');
var url = require('url');
var util = require('util');
var emf = require('./emf');

var app = new emf.Application();
app.routeManager.addRoute('/*', new emf.Controller.File());
app.routeManager.addRoute('/*', function(req, res, e) {
	
});
app.filterManager.addFilter(function(req, res) {
	console.log('Got a request: ' + req.url);
	return req;
});
app.start();
