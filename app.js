var http = require('http');
var url = require('url');
var util = require('util');
var emf = require('./emf');
var logger = require('winston');

var sass = require('./emf.sass');

var app = new emf.Application();
app.routes.get(':filename').to(function(req) {
	for ( var index = 0; index < arguments.length; ++index ) {
		console.error('argument[%d]: %s', index, arguments[index]);
	}
	req.parameters.happiness = 1;
}).to(function(req, happiness) {
	for ( var index = 0; index < arguments.length; ++index ) {
		console.error('argument[%d]: %s', index, arguments[index]);
	}
});

app.start();

