var path = require('path');
var pipes = require('./pipes');

var app = new pipes.Application();
/*
app.decorate('request').with({
  cookies: function() {},
  stuff: a
});
*/

app.routes.get(':filename')
	.to(pipes.pipe.streamFile, {baseDirectory: path.join(process.cwd(), 'public')})
	;

app.routes.then(pipes.pipe.zipStream).then(pipes.pipe.sendStream);

app.start();

