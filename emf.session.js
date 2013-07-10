var util = require('util');

var DEFAULT_MAINTENANCE_INTERVAL = 1000 * 60;
var DEFAULT_MAINTENANCE_TIMEOUT = 1000 * 60 * 60;

function Session(sessionId) {
	this.sessionId = sessionId;
	this.creationTime = new Date().getTime();
	this.accessTime = new Date().getTime();
	this.data = {};
}

Session.prototype.touch = function() {
	this.accessTime = new Date().getTime();
};

function SessionManager(options) {
	options = options || {};
	this.maintenanceInterval = options.maintenanceInterval || DEFAULT_MAINTENANCE_INTERVAL;
	this.maintenanceTimeout = options.maintenanceTimeout || DEFAULT_MAINTENANCE_TIMEOUT;

	this.maintenanceIntervalId = setInterval(function() {
		this.expireSessions();
	}, this.experationInterval);
}

SessionManager.prototype.expireSessions = function() {
	return;
};

SessionManager.prototype.end = function() {
	if (this.maintenanceIntervalId !== null) {
		clearInterval(this.maintenanceIntervalId);
	}
	this.maintenanceIntervalId = null;
};

function MemorySessionManager(options) {
	options = options || {};
	Session.call(this, options);
	this.sessions = {};
}
util.inherits(MemorySessionManager, SessionManager);

MemorySessionManager.prototype.set = function(sessionId, data) {

};

MemorySessionManager.prototype.exists = function(sessionId) {
	return (this.sessions[sessionId] !== null && this.sessions[sessionId] !== undefined);
};

MemorySessionManager.prototype.get = function(sessionId) {
	var session = this.sessions[sessionId];
	if (session) {
		session.touch();
		return session.data;
	}
	return null;
};

MemorySessionManager.prototype.expireSessions = function() {
	var currentTime = new Date().getTime();
	var sessionIds = Object.keys(this.sessions);
	for ( var index = 0; index < sessionIds.length; ++index) {
		var sessionId = sessionIds[index];
		var session = this.sessions[sessionId];
		var sinceLast = currentTime - session.accessTime;
		if (sinceLast > this.maintenanceTimeout) {
			delete this.sessions[sessionId];
		}
	}
};

exports.Session = Session;
exports.SessionManager = SessionManager;
exports.MemorySessionManager = MemorySessionManager;