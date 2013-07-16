var mime = require('mime');

function lookup(pathname) {
	return	mime.lookup(pathname);
}

exports.lookup = lookup;