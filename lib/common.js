var animation, async, config, dialog, fs, initJSON, initWrite, initWriteConfirm, install, log, maxmertkit, modifiers, pack, path, project, request, themes, widgets, wrench, _;

pack = require('../package.json');

async = require('async');

request = require('superagent');

fs = require('fs');

dialog = require('commander');

wrench = require('wrench');

path = require('path');

_ = require('underscore');

config = require('./config');

modifiers = require('./modifiers');

animation = require('./animation');

themes = require('./themes');

widgets = require('./widgets');

project = require('./project');

maxmertkit = require('./maxmertkit');

log = require('./logger');

exports.init = function(options) {
  var _this = this;
  return async.series({
    "default": function(callback) {
      return initJSON(options, callback);
    }
  }, function(err, res) {
    if (err != null) {
      return log.error("An error while initialize maxmertkit.json");
    } else {
      if ((options.theme == null) && (options.modifier == null) && (options.widget == null) && !options.animation) {
        widgets.init(options);
      }
      if (options.widget) {
        widgets.init(options);
      }
      if (options.theme) {
        themes.init(options);
      }
      if (options.modifier) {
        modifiers.init(options);
      }
      if (options.animation) {
        return animation.init(options);
      }
    }
  });
};

exports.publish = function(options) {
  var mjson;
  mjson = maxmertkit.json();
  switch (mjson.type) {
    case 'widget':
      return widgets.publish(options);
    case 'modifier':
      return modifiers.publish(options);
    case 'theme':
      return themes.publish(options);
    case 'animation':
      return animation.publish(options);
  }
};

exports.unpublish = function(options) {
  var mjson;
  mjson = maxmertkit.json();
  switch (mjson.type) {
    case 'widget':
      return widgets.unpublish(options);
    case 'modifier':
      return modifiers.unpublish(options);
    case 'theme':
      return themes.unpublish(options);
    case 'animation':
      return animation.unpublish(options);
  }
};

exports.install = function(options) {
  var mjson;
  mjson = maxmertkit.json();
  fs.writeFileSync(path.join(config.directory(), '_vars.sass'), "");
  return install('.', mjson.dependences, mjson.themes);
};

install = function(pth, includes, themesGlobal) {
  if (includes == null) {
    includes = false;
  }
  return wrench.readdirRecursive(pth, function(error, files) {
    var file, index, mjson, thms, _results;
    _results = [];
    for (index in files) {
      file = files[index];
      file = path.join(pth, file);
      if (path.basename(file) === 'maxmertkit.json') {
        mjson = maxmertkit.json(file);
        fs.writeFileSync(path.join(path.dirname(file), '_imports.sass'), "");
        if (mjson.dependences != null) {
          pth = path.join(path.dirname(file), 'dependences/widgets');
          wrench.rmdirSyncRecursive(pth, function() {});
          wrench.mkdirSyncRecursive(pth, 0x1ff);
          if ((themesGlobal != null) && includes) {
            if (mjson.themes != null) {
              mjson.themes = _.extend(mjson.themes, themesGlobal);
            } else {
              mjson.themes = themesGlobal;
            }
          }
          if (mjson.type === 'widget') {
            widgets.install(pth, mjson, install, includes, themesGlobal);
          } else {
            project.install(pth, mjson, install, includes, themesGlobal);
          }
        }
        if (mjson.modifiers != null) {
          pth = path.join(path.dirname(file), 'dependences/modifiers');
          wrench.rmdirSyncRecursive(pth, function() {});
          wrench.mkdirSyncRecursive(pth, 0x1ff);
          modifiers.install(pth, mjson.modifiers);
        }
        if (mjson.animation != null) {
          pth = path.join(path.dirname(file), 'dependences/animation');
          wrench.rmdirSyncRecursive(pth, function() {});
          wrench.mkdirSyncRecursive(pth, 0x1ff);
          animation.install(pth, mjson.animation);
        }
        if (mjson.themes != null) {
          thms = mjson.themes;
          if (themesGlobal != null) {
            thms = _.extend(mjson.themes, themesGlobal);
          }
          pth = path.join(path.dirname(file), 'dependences/themes');
          wrench.rmdirSyncRecursive(pth, function() {});
          wrench.mkdirSyncRecursive(pth, 0x1ff);
          _results.push(themes.install(pth, thms, true));
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  });
};

initJSON = function(options, callback) {
  var _this = this;
  return async.series({
    type: function(callback) {
      if (!options.theme && !options.modifier && !options.widget && !options.animation) {
        return callback(null, 'project');
      } else if (options.widget) {
        return callback(null, 'widget');
      } else if (options.theme) {
        return callback(null, 'theme');
      } else if (options.modifier) {
        return callback(null, 'modifier');
      } else if (options.animation) {
        return callback(null, 'animation');
      }
    },
    name: function(callback) {
      var defaultPkgName;
      defaultPkgName = 'test';
      return dialog.prompt("name: (test) ", function(pkgName) {
        if (pkgName === '') {
          pkgName = defaultPkgName;
        }
        return callback(null, pkgName);
      });
    },
    version: function(callback) {
      var defaultVersion;
      defaultVersion = '0.0.0';
      return dialog.prompt("version: (0.0.0) ", function(version) {
        if (version === '') {
          version = defaultVersion;
        }
        return callback(null, version);
      });
    },
    description: function(callback) {
      return dialog.prompt("description: ", function(description) {
        return callback(null, description);
      });
    },
    image: function(callback) {
      if ((options.animation != null) && options.animation) {
        return dialog.prompt("title image ulr: (none) ", function(imgName) {
          if (imgName === '') {
            imgName = null;
          }
          return callback(null, imgName);
        });
      } else {
        return callback(null, null);
      }
    },
    tags: function(callback) {
      return dialog.prompt("tags (through comma): ", function(tags) {
        return callback(null, tags);
      });
    },
    themeUse: function(callback) {
      if ((options.widget != null) && options.widget) {
        return dialog.confirm("Will it use themes?\n(y/n) -> ", function(ok) {
          return callback(null, ok);
        });
      } else {
        return callback(null, null);
      }
    },
    repository: function(callback) {
      return dialog.prompt("repository: ", function(repository) {
        return callback(null, repository);
      });
    },
    site: function(callback) {
      return dialog.prompt("projet\'s site: ", function(site) {
        return callback(null, site);
      });
    },
    author: function(callback) {
      return dialog.prompt("author: ", function(author) {
        return callback(null, author);
      });
    },
    license: function(callback) {
      var defaultLicense;
      defaultLicense = 'BSD';
      return dialog.prompt("license: (BSD) ", function(license) {
        if (license === '') {
          license = defaultLicense;
        }
        return callback(null, license);
      });
    }
  }, function(err, maxmertkitjson) {
    return initWriteConfirm(path.join(config.directory(), pack.maxmertkit), maxmertkitjson, callback);
  });
};

initWriteConfirm = function(file, json, callback) {
  var _this = this;
  console.log("\n\nWriting file " + file + "\n");
  return dialog.confirm("Is everything correct? \n\n " + (JSON.stringify(json, null, 4)) + "\n-> ", function(ok) {
    console.log("");
    if (!ok) {
      log.error("Initializing canceled");
      callback(true, null);
      return process.stdin.destroy();
    } else {
      return fs.exists(file, function(exists) {
        if (!exists) {
          return initWrite(file, json, callback);
        } else {
          log.error("File " + file + " already exists.");
          return dialog.confirm("Do you want to overwrite it and all other files in that folder? -> ", function(ok) {
            if (!ok) {
              log.error("initialization canceled.");
              return callback(ok, null);
            } else {
              return initWrite(file, json, callback);
            }
          });
        }
      });
    }
  });
};

initWrite = function(file, json, callback) {
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
