var archives, async, config, dialog, fs, immediately, jsdom, log, maxmertkit, md, modifiers, mustache, pack, path, request, templates, themes, write, _;

pack = require('../package.json');

templates = require('../templates.json');

config = require('./config');

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

modifiers = require('./modifiers');

if (global.setImmediate != null) {
  immediately = global.setImmediate;
}

exports.init = function(options) {
  var fileName, mjson, myvarsFileName, paramsFileName, varsFileName,
    _this = this;
  fileName = path.join(config.directory(), '_index.sass');
  paramsFileName = path.join(config.directory(), '_params.sass');
  varsFileName = path.join(config.directory(), '_vars.sass');
  myvarsFileName = path.join(config.directory(), '_myvars.sass');
  mjson = maxmertkit.json();
  return async.series({
    paths: function(callback) {
      return write(path.join(config.directory(), '_paths.sass'), "// Generated with mwm – maxmertkit widget manager\n", callback);
    },
    imports: function(callback) {
      return write(path.join(config.directory(), '_imports.sass'), "// Generated with mwm – maxmertkit widget manager\n", callback);
    },
    params: function(callback) {
      return write(paramsFileName, mustache.render(templates.params, mjson), callback);
    },
    vars: function(callback) {
      return write(varsFileName, "", callback);
    },
    myvars: function(callback) {
      return write(myvarsFileName, "$" + mjson.name + ": -" + mjson.name, callback);
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
    checkFields: function(callback) {
      if (mjson.themeUse == null) {
        return callback("Set themeUse option and then publish");
      } else if (mjson.name == null) {
        return callback("Set name option and then publish");
      } else if (mjson.version == null) {
        return callback("Set version option and then publish");
      } else if (mjson.tags == null) {
        return callback("Set tags option and then publish");
      } else {
        return callback(null, true);
      }
    },
    widget: function(callback) {
      return archives.pack(config.directory(), callback);
    },
    password: function(callback) {
      return dialog.password('\nEnter your password: ', function(password) {
        return callback(null, password);
      });
    },
    readme: function(callback) {
      var readme, readmeHTML;
      readme = '';
      readmeHTML = '';
      return fs.exists(path.join(config.directory(), 'README.md'), function(exist) {
        if (exist) {
          readme = fs.readFileSync(path.join(config.directory(), 'README.md'), "utf8");
          readmeHTML = md.toHTML(readme);
        }
        return callback(null, {
          readme: readme,
          readmeHTML: readmeHTML
        });
      });
    },
    test: function(callback) {
      var testHTML;
      testHTML = '';
      return fs.exists(path.join(config.directory(), 'test.html'), function(exist) {
        if (exist) {
          testHTML = fs.readFileSync(path.join('.', 'test.html'), "utf8");
          return jsdom.env({
            html: testHTML,
            scripts: ["http://code.jquery.com/jquery-1.5.min.js"],
            done: function(err, window) {
              var $, testHTMLresult;
              $ = window.jQuery;
              if (($(testHTML) != null) && $(testHTML).find('body')) {
                testHTMLresult = $(testHTML).find('body').html();
              } else {
                testHTMLresult = '';
              }
              return callback(null, testHTMLresult);
            }
          });
        } else {
          return callback(null, testHTML);
        }
      });
    },
    testCSS: function(callback) {
      var testCSS;
      testCSS = '';
      return fs.exists(path.join(config.directory(), 'index.css'), function(exist) {
        if (exist) {
          testCSS = fs.readFileSync(path.join(config.directory(), 'index.css'), "utf8");
          return callback(null, testCSS);
        } else {
          return callback(null, testCSS);
        }
      });
    }
  }, function(err, res) {
    var anims, deps, mods, ok, packFile, thms;
    if (err != null) {
      log.error("Publishing canceled. " + err);
      return process.stdin.destroy();
    } else {
      if ((mjson.repository == null) && (mjson.site == null) && (res.test == null) && (res.readme == null) && (res.readme.readme == null)) {
        log.error("Yout dont have any repository, widget site, test file or readme file. Other users will not understand how to use it.");
        return process.stdin.destroy();
      } else {
        packFile = path.join(config.directory(), "" + mjson.name + "@" + mjson.version + ".tar");
        if (JSON.stringify(mjson.dependences) != null) {
          deps = JSON.stringify(mjson.dependences);
        } else {
          deps = '';
        }
        if (JSON.stringify(mjson.modifiers) != null) {
          mods = JSON.stringify(mjson.modifiers);
        } else {
          mods = '';
        }
        if (JSON.stringify(mjson.themes) != null) {
          thms = JSON.stringify(mjson.themes);
        } else {
          thms = '';
        }
        if (JSON.stringify(mjson.animations) != null) {
          anims = JSON.stringify(mjson.animations);
        } else {
          anims = '';
        }
        ok = true;
        if (mjson.tags == null) {
          log.error("You didn\'t set tags in maxmertkit.json. Publishing canceled.");
          process.stdin.destroy();
          ok = false;
        }
        if (mjson.titleImage == null) {
          mjson.titleImage = '';
        }
        if (mjson.repository == null) {
          mjson.repository = '';
        }
        if (mjson.site == null) {
          mjson.site = '';
        }
        if ((mjson.themeUse == null) || !mjson.themeUse) {
          mjson.themeUse = 'false';
        } else {
          mjson.themeUse = 'true';
        }
        if (ok) {
          return request.post("" + pack.homepage + "/api/0.1/widgets/" + mjson.name + "/" + mjson.version).set('X-Requested-With', 'XMLHttpRequest').attach('pack', packFile).field('packName', path.basename(packFile)).field('password', res.password).field('name', mjson.name).field('version', mjson.version).field('description', mjson.description).field('repository', mjson.repository).field('site', mjson.site).field('license', mjson.license).field('tags', mjson.tags).field('themeUse', mjson.themeUse).field('username', mjson.author).field('test', res.test).field('testCSS', res.testCSS).field('dependences', deps).field('modifiers', mods).field('themes', thms).field('animations', anims).field('readme', res.readme.readme).field('readmeHTML', res.readme.readmeHTML).end(function(res) {
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
      }
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
      return dialog.password('\nEnter your password: ', function(password) {
        return callback(null, password);
      });
    }
  }, function(err, res) {
    if (err) {
      log.error("Could not unpublish widget.");
      if ((typeof callback === "undefined" || callback === null) || typeof callback === 'object') {
        return process.stdin.destroy();
      } else {
        return callback(err, mjson.name);
      }
    } else {
      return request.del("" + pack.homepage + "/api/0.1/widgets/" + mjson.name + "/" + mjson.version).set('X-Requested-With', 'XMLHttpRequest').field('packName', fileName).field('name', mjson.name).field('version', mjson.version).field('password', res.password).field('username', mjson.author).end(function(res) {
        if (res.ok) {
          log.requestSuccess("widget " + mjson.name + "@" + mjson.version + " successfully unpublished.");
          if ((typeof callback === "undefined" || callback === null) || typeof callback === 'object') {
            return process.stdin.destroy();
          } else {
            return callback(null, mjson.name);
          }
        } else {
          log.requestError(res.body.msg, 'ERRR', res.status);
          if ((typeof callback === "undefined" || callback === null) || typeof callback === 'object') {
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
      return req = request.get("" + pack.homepage + "/api/0.1/widgets/" + widget.name + "/" + widget.version + "/exist").set('X-Requested-With', 'XMLHttpRequest').end(function(res) {
        var stream;
        if (res.ok && res.body.exist) {
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
                if (path.dirname(path.join(pth, widget.name, '_myvars.sass')) !== '.') {
                  fs.readFile(path.join(pth, widget.name, '_myvars.sass'), function(err, data) {
                    var widgetPath;
                    if (err == null) {
                      widgetPath = path.join(pth, widget.name);
                      fs.appendFile(path.join(config.directory(), '_paths.sass'), "$" + widget.name + "-path: '" + widgetPath + "'\n", function(err) {});
                      return fs.appendFile(path.join(config.directory(), '_vars.sass'), "\n" + data + "\n", function(err) {});
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
          if ((callback == null) || typeof callback === 'object') {
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
