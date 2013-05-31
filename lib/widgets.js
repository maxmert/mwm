var archives, async, dialog, fs, immediately, jsdom, log, maxmertkit, md, modifyers, mustache, pack, path, request, templates, themes, write, _;

pack = require('../package.json');

templates = require('../templates.json');

async = require('async');

request = require('superagent');

fs = require('fs');

path = require('path');

dialog = require('commander');

_ = require('underscore');

mustache = require('mustache');

md = require('markdown').markdown;

jsdom = require('jsdom');

log = require('./logger');

archives = require('./archives');

maxmertkit = require('./maxmertkit');

themes = require('./themes');

modifyers = require('./modifyers');

if (global.setImmediate != null) {
  immediately = global.setImmediate;
}

exports.init = function(options) {
  var fileName, mjson, myvarsFileName, paramsFileName, varsFileName,
    _this = this;
  fileName = '_index.sass';
  paramsFileName = '_params.sass';
  varsFileName = '_vars.sass';
  myvarsFileName = '_myvars.sass';
  mjson = maxmertkit.json();
  return async.series({
    imports: function(callback) {
      return write('_imports.sass', "// Generated with mwm – maxmertkit widget manager\n", callback);
    },
    params: function(callback) {
      return write(paramsFileName, mustache.render(templates.params, mjson), callback);
    },
    vars: function(callback) {
      return write(varsFileName, "", callback);
    },
    myvars: function(callback) {
      return write(myvarsFileName, "", callback);
    },
    index: function(callback) {
      return write(fileName, mustache.render(templates.widget, mjson), callback);
    }
  }, function(err, res) {
    if (err != null) {
      log.error("An error while initialized widget.");
      return process.stdin.destroy();
    } else {
      return process.stdin.destroy();
    }
  });
};

exports.publish = function(options) {
  var mjson,
    _this = this;
  mjson = maxmertkit.json();
  return async.series({
    widget: function(callback) {
      return archives.pack('.', callback);
    },
    password: function(callback) {
      return callback(null, 'linolium');
    },
    readme: function(callback) {
      var readme, readmeHTML, titleImage;
      readme = '';
      readmeHTML = '';
      titleImage = '';
      return fs.exists(path.join('.', 'README.md'), function(exist) {
        if (exist) {
          readme = fs.readFileSync(path.join('.', 'README.md'), "utf8");
          readmeHTML = md.toHTML(readme);
          return jsdom.env({
            html: readmeHTML,
            scripts: ["http://code.jquery.com/jquery-1.5.min.js"]
          }, function(err, window) {
            var $;
            $ = window.jQuery;
            titleImage = $(readmeHTML).find('img').attr('src');
            return callback(null, {
              readme: readme,
              readmeHTML: readmeHTML,
              titleImage: titleImage
            });
          });
        } else {
          return callback(null, {
            readme: readme,
            readmeHTML: readmeHTML,
            titleImage: titleImage
          });
        }
      });
    }
  }, function(err, res) {
    var deps, mods, packFile, thms;
    if (err != null) {
      log.error("Publishing canceled.");
      return process.stdin.destroy();
    } else {
      packFile = path.join('.', "" + mjson.name + "@" + mjson.version + ".tar");
      if (JSON.stringify(mjson.dependences) != null) {
        deps = JSON.stringify(mjson.dependences);
      } else {
        deps = '';
      }
      if (JSON.stringify(mjson.modifyers) != null) {
        mods = JSON.stringify(mjson.modifyers);
      } else {
        mods = '';
      }
      if (JSON.stringify(mjson.themes) != null) {
        thms = JSON.stringify(mjson.themes);
      } else {
        thms = '';
      }
      return request.post("" + pack.homepage + "/api/0.1/widgets/" + mjson.name + "/" + mjson.version).set('X-Requested-With', 'XMLHttpRequest').attach('pack', packFile).field('packName', path.basename(packFile)).field('titleImage', res.readme.titleImage).field('password', res.password).field('name', mjson.name).field('version', mjson.version).field('description', mjson.description).field('repository', mjson.repository).field('license', mjson.license).field('username', mjson.author).field('dependences', deps).field('modifyers', mods).field('themes', thms).field('readme', res.readme.readme).field('readmeHTML', res.readme.readmeHTML).end(function(res) {
        if (res.ok) {
          log.requestSuccess("widget " + mjson.name + "@" + mjson.version + " successfully published.");
          process.stdin.destroy();
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          process.stdin.destroy();
        }
        return fs.unlink(packFile);
      });
    }
  });
};

exports.unpublish = function(options) {
  var fileName, mjson,
    _this = this;
  mjson = maxmertkit.json();
  fileName = "" + mjson.name + "@" + mjson.version + ".tar";
  return async.series({
    password: function(callback) {
      return callback(null, 'linolium');
    }
  }, function(err, res) {
    if (err) {
      log.error("Could not unpublish widget.");
      if (!(typeof callback !== "undefined" && callback !== null) || typeof callback === 'object') {
        return process.stdin.destroy();
      } else {
        return callback(err, mjson.name);
      }
    } else {
      return request.del("" + pack.homepage + "/api/0.1/widgets/" + mjson.name + "/" + mjson.version).set('X-Requested-With', 'XMLHttpRequest').field('packName', fileName).field('name', mjson.name).field('version', mjson.version).field('password', res.password).field('username', mjson.author).end(function(res) {
        if (res.ok) {
          log.requestSuccess("widget " + mjson.name + "@" + mjson.version + " successfully unpublished.");
          if (!(typeof callback !== "undefined" && callback !== null) || typeof callback === 'object') {
            return process.stdin.destroy();
          } else {
            return callback(null, mjson.name);
          }
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          if (!(typeof callback !== "undefined" && callback !== null) || typeof callback === 'object') {
            return process.stdin.destroy();
          } else {
            return callback(true, mjson.name);
          }
        }
      });
    }
  });
};

write = function(file, data, callback) {
  return fs.writeFile(file, data, function(err) {
    if (err) {
      log.error("initializing – " + err + ".");
      return callback(err, null);
    } else {
      log.success("file " + file + " successfully created.");
      return callback(null, data);
    }
  });
};

exports.install = function(pth, mjson, calll, depent, themesss) {
  var arr;
  arr = [];
  _.each(mjson.dependences, function(ver, name) {
    return arr.push({
      name: name,
      version: ver.version != null ? ver.version : ver,
      themes: ver.themes != null ? ver.themes : mjson.themes
    });
  });
  return async.eachSeries(arr, function(widget, callback) {
    var _this = this;
    this.calll = calll;
    this.depent = depent;
    return process.nextTick(function(calll, depent, themesss) {
      var fileName, req;
      fileName = "" + widget.name + "@" + widget.version + ".tar";
      return req = request.get("" + pack.homepage + "/api/0.1/widgets/" + widget.name + "/" + widget.version).set('X-Requested-With', 'XMLHttpRequest').end(function(res) {
        var stream;
        if (res.ok) {
          req = request.get("" + pack.homepage + "/api/0.1/widgets/" + widget.name + "/" + widget.version).set('X-Requested-With', 'XMLHttpRequest');
          stream = fs.createWriteStream(path.join(pth, fileName));
          req.pipe(stream);
          return stream.on('close', function() {
            return archives.unpack(path.join(pth, fileName), function(err) {
              if (err != null) {
                log.error("Couldn\'t unpack " + widget.name + "@" + widget.version + ".tar");
                return callback(true, null);
              } else {
                fs.unlink(path.join(pth, fileName));
                if (path.dirname(path.join(pth, '../../_myvars.sass')) !== '.') {
                  fs.readFile(path.join(pth, '../../_myvars.sass'), function(err, data) {
                    if (!(err != null)) {
                      return fs.appendFile('_vars.sass', "\n" + data + "\n", function(err) {});
                    }
                  });
                }
                return fs.readFile(path.join(pth, '../../_imports.sass'), function(err, data) {
                  if (err != null) {
                    log.error("Coluld not read " + (path.join(pth, '../../_imports.sass')) + ".");
                    return process.stdin.destroy();
                  } else {
                    data = data + ("@import 'dependences/widgets/" + widget.name + "/_index.sass'\n");
                    return fs.writeFile(path.join(pth, '../../_imports.sass'), data, function(err) {
                      if (err != null) {
                        return callback(true, null);
                      } else {
                        fs.writeFileSync(path.join(pth, widget.name, '_params.sass'), "$dependent: " + depent + "\n");
                        if (widget.themes != null) {
                          if (themesss != null) {
                            themesss = _.extend(widget.themes, themesss);
                          } else {
                            themesss = widget.themes;
                          }
                        }
                        _this.calll(path.join(pth, widget.name), _this.depent, themesss);
                        return callback();
                      }
                    });
                  }
                });
              }
            });
          });
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          if (!(callback != null) || typeof callback === 'object') {
            return process.stdin.destroy();
          } else {
            return callback(true, widget.name);
          }
        }
      });
    });
  }, function(err) {
    if (err != null) {
      log.error("An error while installing widgets: " + err);
      return process.stdin.destroy();
    }
  });
};