var config, fs, log, pack, path;

pack = require('../package.json');

config = require('./config');

fs = require('fs');

path = require('path');

log = require('./logger');

exports.json = function(pth) {
  var json, rawjson;
  if (pth == null) {
    pth = path.join(config.directory(), pack.maxmertkit);
  }
  rawjson = fs.readFileSync(pth);
  if (rawjson == null) {
    log.error("couldn\'t read " + pack.maxmertkit + " file.");
    return process.stdin.destroy();
  } else {
    return json = JSON.parse(rawjson);
  }
};
