var path = require('path');
var Pipes = require('./pipes');

var app = new Pipes({listenPort: 8888});

app.routes.all(':filename')
	.to(Pipes.pipe.streamFile, {baseDirectory: path.join(process.cwd(), 'public')})
	;

app.routes.then(Pipes.pipe.zipStream).then(Pipes.pipe.sendStream);

app.start();

