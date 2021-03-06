var async, config, dialog, fs, log, maxmertkit, pack, path, request, sass, wrench, write;

pack = require('../package.json');

config = require('./config');

async = require('async');

request = require('superagent');

fs = require('fs');

path = require('path');

dialog = require('commander');

wrench = require('wrench');

log = require('./logger');

maxmertkit = require('./maxmertkit');

exports.init = function(options) {
  var fileName,
    _this = this;
  fileName = path.join(config.directory(), 'modifier.json');
  return async.series({
    modifier: function(callback) {
      return request.get("" + pack.homepage + "/api/0.1/defaults/modifier").set('X-Requested-With', 'XMLHttpRequest').set('Accept', 'application/json').end(function(res) {
        if (res.ok) {
          return write(fileName, res.body, callback);
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          return callback(res.error, null);
        }
      });
    }
  }, function(err, res) {
    if (err != null) {
      log.error("An error while initialized modifier.");
      return process.stdin.destroy();
    } else {
      return process.stdin.destroy();
    }
  });
};

exports.publish = function(options) {
  var fileName, mjson,
    _this = this;
  mjson = maxmertkit.json();
  fileName = 'modifier.json';
  return async.series({
    modifier: function(callback) {
      return fs.exists(path.join(config.directory(), fileName), function(exist) {
        var json, rawjson;
        if (!exist) {
          log.error("couldn\'t read " + fileName + " file.");
          return callback(true, null);
        } else {
          rawjson = fs.readFileSync(path.join(config.directory(), fileName));
          if (rawjson == null) {
            log.error("couldn\'t read " + fileName + " file.");
            return callback(true, null);
          } else {
            json = JSON.parse(rawjson);
            return callback(null, json);
          }
        }
      });
    },
    password: function(callback) {
      return dialog.password('\nEnter your password: ', function(password) {
        return callback(null, password);
      });
    }
  }, function(err, res) {
    if (err != null) {
      log.error("Publishing canceled.");
      return process.stdin.destroy();
    } else {
      return request.post("" + pack.homepage + "/api/0.1/modifiers/" + mjson.name + "/" + mjson.version).set('X-Requested-With', 'XMLHttpRequest').send({
        modifier: res.modifier,
        password: res.password,
        name: mjson.name,
        version: mjson.version,
        username: mjson.author
      }).end(function(res) {
        if (res.ok) {
          log.requestSuccess("modifier " + mjson.name + "@" + mjson.version + " successfully published.");
          return process.stdin.destroy();
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          return process.stdin.destroy();
        }
      });
    }
  });
};

exports.unpublish = function(options) {
  var mjson,
    _this = this;
  mjson = maxmertkit.json();
  return async.series({
    password: function(callback) {
      return dialog.password('\nEnter your password: ', function(password) {
        return callback(null, password);
      });
    }
  }, function(err, res) {
    if (err != null) {
      log.error("Unpublishing canceled.");
      return process.stdin.destroy();
    } else {
      return request.del("" + pack.homepage + "/api/0.1/modifiers/" + mjson.name + "/" + mjson.version).set('X-Requested-With', 'XMLHttpRequest').send({
        password: res.password,
        name: mjson.name,
        version: mjson.version,
        username: mjson.author
      }).end(function(res) {
        if (res.ok) {
          log.requestSuccess("modifier " + mjson.name + "@" + mjson.version + " successfully unpublished.");
          return process.stdin.destroy();
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          return process.stdin.destroy();
        }
      });
    }
  });
};

exports.install = function(pth, list) {
  var name, version, _results;
  wrench.mkdirSyncRecursive(pth, 0x1ff);
  _results = [];
  for (name in list) {
    version = list[name];
    _results.push((function(name, version, pth) {
      var _this = this;
      return request.get("" + pack.homepage + "/api/0.1/modifiers/" + name + "/" + version).set('X-Requested-With', 'XMLHttpRequest').end(function(res) {
        var fileName, str;
        if (res.ok) {
          str = "$mod-" + name + ": " + res.body.modifier["class"];
          fileName = path.join(pth, "_" + name + ".sass");
          return sass(fileName, str, function(err, res) {
            if (err != null) {
              return log.error("Couldn\'t write file " + fileName);
            } else {
              return fs.appendFile(path.join(pth, '../../_imports.sass'), "@import 'dependences/modifiers/_" + name + ".sass'\n", function(err) {
                if (err != null) {
                  return log.error("Couldn\'t append import of " + fileName + " to the file _imports.sass");
                } else {
                  return log.requestSuccess("modifier " + name + "@" + version + " successfully installed.");
                }
              });
            }
          });
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          return process.stdin.destroy();
        }
      });
    })(name, version, pth));
  }
  return _results;
};

write = function(file, json, callback) {
  return fs.writeFile(file, JSON.stringify(json, null, 4), function(err) {
    if (err) {
      log.error("initializing – " + err + ".");
      return callback(err, null);
    } else {
      log.success("file " + file + " successfully created.");
      return callback(null, json);
    }
  });
};

sass = function(fileName, data, callback) {
  return fs.writeFile(fileName, data, function(err) {
    if (err != null) {
      return callback(err, null);
    } else {
      return callback(null, fileName);
    }
  });
};
