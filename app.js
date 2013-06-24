var http = require('http');
var url = require('url');
var util = require('util');
var emf = require('./emf.js');

var app = new emf.Application();
app.routeManager.addRoute('/*', new emf.Controller.File());
app.start();
