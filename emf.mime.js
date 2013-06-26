var path = require('path');

var MIME_TYPES = {
		html: 'text/html',
		htm: 'text/html',
		txt: 'text/plain',
		js: 'application/javascript'
};

function lookup(pathname) {
	var extension = path.extname(pathname);
	if ( extension === undefined ) {
		extension = '';
	}
	
	if ( extension[0] === '.' ) {
		extension = extension.substring(1);
	}

	return MIME_TYPES[extension];
}

exports.lookup = lookup;