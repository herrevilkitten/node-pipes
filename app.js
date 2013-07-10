var path = require('path');
var emf = require('./emf');

//var sass = require('./emf.sass');
var jade = require('./emf.jade');
var controller = require('./emf.controller').controller;

var app = new emf.Application();

app.routes.to(controller.parseCookies);

app.routes.get(':filename')
	.to(controller.streamFile, {baseDirectory: path.join(process.cwd(), 'public')})
	.to(controller.sendStream);


app.start();

