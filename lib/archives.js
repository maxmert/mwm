var async, fs, fstream, log, maxmertkit, mustache, ncp, path, request, rmdirSyncForce, tar, wrench, _;

maxmertkit = require('./maxmertkit');

request = require('superagent');

path = require('path');

log = require('./logger');

async = require('async');

tar = require('tar');

mustache = require('mustache');

_ = require('underscore');

wrench = require('wrench');

fs = require('fs');

ncp = require('ncp').ncp;

fstream = require('fstream');

exports.pack = function(folder, callback) {
  var directoryName, fileName, mjson,
    _this = this;
  mjson = maxmertkit.json();
  if (path.basename(path.resolve(folder)) === ("" + mjson.name)) {
    if (mjson.type === 'widget') {
      directoryName = "/tmp/" + mjson.name;
      fileName = "" + mjson.name + "@" + mjson.version + ".tar";
      return async.series({
        rmdir: function(callback) {
          return fs.exists(directoryName, function(exists) {
            if (exists) {
              rmdirSyncForce(directoryName, callback);
            }
            return callback(null, 'yes');
          });
        },
        dir: function(callback) {
          return fs.mkdir(directoryName, 0x1ff, function() {
            return callback(null, directoryName);
          });
        },
        store: function(callback) {
          return _this.store(callback);
        },
        pack: function(callback) {
          return fstream.Reader({
            path: directoryName,
            type: 'Directory'
          }).pipe(tar.Pack({})).pipe(fstream.Writer("/tmp/" + fileName).on('close', function(err) {
            if (err != null) {
              log.error('Failed to create package.');
              if (callback == null) {
                return process.stdin.destroy();
              } else {
                return callback(err, fileName);
              }
            } else {
              return callback(null, fileName);
            }
          }));
        },
        restore: function(callback) {
          return _this.restore(fileName, callback);
        }
      }, function(err, res) {
        log.success("Finished to create package");
        if (callback == null) {
          return process.stdin.destroy();
        } else {
          return callback(null, fileName);
        }
      });
    } else {
      log.error("You need to pack only widgets.");
      if (callback == null) {
        return process.stdin.destroy();
      } else {
        return callback(false, fileName);
      }
    }
  } else {
    log.error("The folders name (" + (path.basename(path.resolve('.'))) + ") should be the same as your package name in maxmertkit.json (" + mjson.name + ").");
    if (callback == null) {
      return process.stdin.destroy();
    } else {
      return callback(false, fileName);
    }
  }
};

exports.store = function(callback) {
  var directoryName, mjson;
  mjson = maxmertkit.json();
  directoryName = "/tmp/" + mjson.name;
  return ncp('.', directoryName, {
    filter: function(name) {
      var currentName, pth;
      currentName = path.relative('.', name).split(path.sep)[0];
      pth = path.relative('.', name);
      if (currentName.charAt(0) === '.' || pth.indexOf('dependences') !== -1 || pth.indexOf('.tar') !== -1 || pth.indexOf('.sass-cache') !== -1 || pth.indexOf('.sass-cache') !== -1 || pth.indexOf('.css') !== -1 || pth.indexOf('config.rb') !== -1 || pth.indexOf('_vars.sass') !== -1 || pth.indexOf('_imports.sass') !== -1) {
        return false;
      } else {
        return true;
      }
    }
  }, function(err) {
    if (err) {
      log.error("Failed to store current directory to " + directoryName + " folder. Do you have permissions?");
      if (callback == null) {
        return process.stdin.destroy();
      } else {
        return callback(err, directoryName);
      }
    } else {
      if (callback == null) {
        return process.stdin.destroy();
      } else {
        return callback(null, directoryName);
      }
    }
  });
};

exports.restore = function(fileName, callback) {
  return fs.readFile(path.join('/tmp/', fileName), function(err, data) {
    if (err != null) {
      log.error("Failed to restore " + fileName + " from /tmp folder. Maybe there is no such file or folder.");
      if (callback == null) {
        return process.stdin.destroy();
      } else {
        return callback(err, fileName);
      }
    } else {
      return fs.writeFile(path.join('.', fileName), data, function(err) {
        if (err != null) {
          log.error("Failed to restore " + fileName + " from /tmp folder. Maybe you do not have permissions to write in current folder.");
          if (callback == null) {
            return process.stdin.destroy();
          } else {
            return callback(err, fileName);
          }
        } else {
          if (callback == null) {
            return process.stdin.destroy();
          } else {
            return callback(null, fileName);
          }
        }
      });
    }
  });
};

exports.unpack = function(fileName, callback) {
  var mjson;
  if (fileName == null) {
    mjson = maxmertkit.json();
    fileName = "" + mjson.name + "@" + mjson.version + ".tar";
  }
  return fs.createReadStream(path.join('.', fileName)).pipe(tar.Extract({
    path: path.dirname(fileName)
  }).on('error', function(err) {
    log.error("Failed to unpack " + fileName + " width error:\n" + err);
    if ((callback == null) || typeof callback === 'object') {
      return process.stdin.destroy();
    } else {
      return callback(err, fileName);
    }
  }).on('end', function() {
    log.success("File " + fileName + " unpacked.");
    if ((callback == null) || typeof callback === 'object') {
      return process.stdin.destroy();
    } else {
      return callback(null, fileName);
    }
  }));
};

rmdirSyncForce = function(path) {
  var file, fileStats, files, filesLength, _i, _len;
  if (path[path.length - 1] !== '/') {
    path = path + '/';
  }
  files = fs.readdirSync(path);
  filesLength = files.length;
  if (filesLength) {
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      fileStats = fs.statSync(path + file);
      if (fileStats.isFile()) {
        fs.unlinkSync(path + file);
      }
      if (fileStats.isDirectory()) {
        rmdirSyncForce(path + file);
      }
    }
  }
  return fs.rmdirSync(path);
};
