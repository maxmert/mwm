var fs, log, pack, path;

pack = require('../package.json');

fs = require('fs');

path = require('path');

log = require('./logger');

exports.directory = function() {
  var conf;
  if (fs.existsSync(".mwmc")) {
    conf = JSON.parse(fs.readFileSync(".mwmc", {
      encoding: 'utf8'
    }));
    if (conf.directory != null) {
      return conf.directory;
    } else {
      return '.';
    }
  } else {
    return '.';
  }
};
