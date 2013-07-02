var http = require('http');
var url = require('url');
var util = require('util');
var emf = require('./emf');
var logger = require('winston');

var app = new emf.Application();
app.routes.get('/**', new emf.Controller.File());
app.start();
