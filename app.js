var http = require('http');
var url = require('url');
var util = require('util');
var emf = require('./emf');
var logger = require('winston');

var sass = require('./emf.sass');

var app = new emf.Application();
app.routes.get('/css/*.sass', new sass.Controller(), [ 'filename' ]);
app.routes.get('/**', new emf.Controller.Public());
app.start();

/*

app.routes.get('/user/login', user.LoginController);
app.routes.get('/user')
	.get('/login', user.LoginController)
	.filter(user.LoggedInFilter)
		.get('/logout', user.LogoutController)
		.get('/account', user.AccountController)
	;
	
RouteManager.get() -- returns new Route
Route.get -- returns existing Route

*/