var jade = require('jade');
var fs = require('fs');

function controller(res, model, template) {
	if ( !fs.existsSync(template) ) {
		console.error('File not found');
		return;
	}
	var options = {
		locals: model
	};

	jade.renderFile(template, options, function(err, html) {
		res.write(html);
		res.end();
	});
}
exports.controller = controller;