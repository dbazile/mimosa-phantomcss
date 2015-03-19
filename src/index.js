'use strict';

var config = require('./config');
var clean = require('./clean');
var execute = require('./execute_tests');
var generateTests = require('./generate_tests');

/**
 * Generates a logger wrapper that prefixes the module name to log output.
 *
 * @param  {object} logger The raw Mimosa logger
 * @return {object}
 */
function generateLoggerProxy(logger) {
  var proxy = {};

  ['info', 'warn', 'success', 'error', 'debug'].forEach(function(level) {
    proxy[level] = function() {
      var fn = logger[level];
      var argsArray = Array.prototype.slice.call(arguments);
      argsArray[0] = 'mimosa-phantomcss: ' + argsArray[0];

      return fn.apply(logger, argsArray);
    };
  });

  return proxy;
}

/**
 * Registers the Mimosa commands for this module.
 *
 * @param  {object} program          Commander.js object
 * @param  {function} retrieveConfig Mimosa callback
 */
function registerCommand(program, logger, retrieveConfig) {
  program
    .command('phantomcss')
    .option('-c, --clean',      'Cleans all .diff and .fail screenshots from the screenshot directory before executing tests')
    .option('-r, --rebaseline', 'Rebuilds all baseline screenshots for all tests')
    .option('-v, --verbose',    'Directly dumps the CasperJS output to the console')
    .option('-D, --mdebug',     'Run in debug mode')
    .description('Runs all visual inspection tests')
    .action(commandRunAllTests);

  program
    .command('phantomcss:clean')
    .option('-D, --mdebug', 'Run in debug mode')
    .description('Cleans all .diff and .fail screenshots from the screenshot directory')
    .action(commandClean);

  program
    .command('phantomcss:gen')
    .option('-D, --mdebug', 'Run in debug mode')
    .description('Generates example PhantomCSS tests in phantomcss.testDirectory')
    .action(commandGenerateTests);

  var loggerProxy = generateLoggerProxy(logger);

  function commandClean(options) {
    var runOptions = {
      buildFirst: false,
      mdebug: !!options.mdebug
    };

    retrieveConfig(runOptions, function(mimosaConfig) {
      loggerProxy.info('Removing all comparison and failure screenshots');
      clean(mimosaConfig.phantomcss.screenshotDirectory, '**/*.{fail,diff}.png', loggerProxy);
    });
  }

  function commandGenerateTests(options) {
    var runOptions = {
      buildFirst: false,
      mdebug: !!options.mdebug
    };

    retrieveConfig(runOptions, function(mimosaConfig) {
      generateTests(mimosaConfig.phantomcss, loggerProxy);
    });
  }

  function commandRunAllTests(options) {
    var runOptions = {
      buildFirst: false,
      mdebug: !!options.mdebug
    };

    retrieveConfig(runOptions, function(mimosaConfig) {

      if (options.rebaseline) {
        loggerProxy.info('Clearing old baseline');
        clean(mimosaConfig.phantomcss.screenshotDirectory, '**/*.png', loggerProxy);
      } else {
        // Ensure `rebaseline` takes precedence over `clean`
        if (options.clean) {
          loggerProxy.info('Removing all comparison and failure screenshots');
          clean(mimosaConfig.phantomcss.screenshotDirectory, '**/*.{fail,diff}.png', loggerProxy);
        }
      }

      if (options.verbose) {
        loggerProxy.debug('Enabling `verbose` flag');
        mimosaConfig.phantomcss.verbose = true;
      }

      execute(mimosaConfig.phantomcss, loggerProxy);
    });
  }
}

module.exports = {
  registerCommand: registerCommand,
  defaults: config.defaults,
  validate: config.validate
};
