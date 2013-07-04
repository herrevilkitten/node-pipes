var http = require('http');
var url = require('url');
var util = require('util');
var emf = require('./emf');
var logger = require('winston');

var sassController = require('./emf.sass').Controller;

var app = new emf.Application();
app.routes.get('/resources/*.sass', new sassController());
app.routes.get('/**', new emf.Controller.Public());
app.start();
