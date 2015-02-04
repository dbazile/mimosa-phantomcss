'use strict';

exports.defaults = function() {
  return {
    phantomcss: {
      verbose: false,
      testDirectory: 'assets/javascripts/tests/visual',
      testPattern: '**/*{test,spec}.{js,coffee}',
      screenshotDirectory: '.mimosa/phantomcss/screenshots',
      libraries: {
        casperjs: './node_modules/phantomcss/node_modules/casperjs',
        phantomcss: './node_modules/phantomcss',
        phantomjs: './node_modules/phantomcss/node_modules/phantomjs'
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
  }

  return errors;
};

