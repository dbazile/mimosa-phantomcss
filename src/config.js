'use strict';

var path = require('path');

exports.defaults = function() {
  var nodeModules = path.resolve(path.join(__dirname, '../node_modules'));

  return {
    phantomcss: {
      verbose: false,
      // enabledOnBuild: false,
      // shouldStopBuildOnFailure: true,
      testDirectory: 'assets/javascripts/tests/visual',
      testPattern: '**/*{test,spec}.{js,coffee}',
      screenshotDirectory: '.mimosa/phantomcss/screenshots',
      libraries: {
        phantomcss: path.join(nodeModules, 'phantomcss'),
        phantomjs: path.join(nodeModules, 'phantomcss/node_modules/phantomjs'),
        casperjs: path.join(nodeModules, 'phantomcss/node_modules/casperjs')
      }
    }
  };
};

exports.validate = function(config, validators) {
  var errors = [];

  if (validators.isObject(errors, 'phantomcss config', config.phantomcss)) {
    if (validators.isObject(errors, 'phantomcss.libraries', config.phantomcss.libraries)) {
      validators.doesPathExist(errors, 'phantomcss.libraries.casperjs', config.phantomcss.libraries.casperjs);
      validators.doesPathExist(errors, 'phantomcss.libraries.phantomcss', config.phantomcss.libraries.phantomcss);
      validators.doesPathExist(errors, 'phantomcss.libraries.phantomjs', config.phantomcss.libraries.phantomjs);
    }

    validators.doesPathExist(errors, 'phantomcss.testDirectory', config.phantomcss.testDirectory);
    validators.isString(errors, 'phantomcss.testPattern', config.phantomcss.testPattern);
    validators.isBoolean(errors, 'phantomcss.verbose', config.phantomcss.verbose);
    // validators.isBoolean(errors, 'phantomcss.enabledOnBuild', config.phantomcss.enabledOnBuild);
    // validators.isBoolean(errors, 'phantomcss.shouldStopBuildOnFailure', config.phantomcss.shouldStopBuildOnFailure);
  }

  return errors;
};
