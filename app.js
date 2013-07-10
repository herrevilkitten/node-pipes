var path = require('path');
var emf = require('./emf');

//var sass = require('./emf.sass');
var jade = require('./emf.jade');
var controller = require('./emf.controller').controller;

var app = new emf.Application();

app.routes.to(controller.parseCookies);

var userRoute = app.routes.get('/users').to(function(session) {
	console.error('Is the user is the session?');
});

userRoute.get('/logout').to(function(req) {
	console.error('omg, logout!');
});

app.routes.get(':filename')
	.to(controller.streamFile, {baseDirectory: path.join(process.cwd(), 'public')})
	.to(controller.sendStream);


app.start();

