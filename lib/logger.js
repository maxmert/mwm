var log, logName, logStatusError, logStatusSuccess, logTypeError, logTypeSuccess, logWidgetName, pack;

log = require('cli-color');

pack = require('../package.json');

/*
Set all colors
*/


logName = log.xterm(255).bgXterm(0);

logTypeError = log.xterm(196).bgXterm(0);

logTypeSuccess = log.xterm(34).bgXterm(0);

logStatusError = log.xterm(196);

logStatusSuccess = log.xterm(34);

logWidgetName = log.xterm(61);

exports.requestError = function(msg, type, status, widget) {
  if (type == null) {
    type = 'ERRR';
  }
  if (status == null) {
    status = 404;
  }
  return console.log("" + (logName(pack.name)) + " " + (logTypeError(type)) + " " + (logStatusError(status)) + " " + (logWidgetName(widget)) + " – " + msg);
};

exports.requestSuccess = function(msg, type, status, widget) {
  if (type == null) {
    type = 'http';
  }
  if (status == null) {
    status = 200;
  }
  return console.log("" + (logName(pack.name)) + " " + (logTypeSuccess(type)) + " " + (logStatusSuccess(status)) + " " + (logWidgetName(widget)) + " – " + msg);
};

exports.error = function(msg, type) {
  if (type == null) {
    type = 'ERRR';
  }
  return console.log("" + (logName(pack.name)) + " " + (logTypeError(type)) + " " + msg);
};

exports.success = function(msg, type) {
  if (type == null) {
    type = 'OK';
  }
  return console.log("" + (logName(pack.name)) + " " + (logTypeSuccess(type)) + " " + msg);
};
