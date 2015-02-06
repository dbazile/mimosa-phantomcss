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
function registerCommand(program, retrieveConfig) {
  program
    .command('phantomcss')
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

  function commandClean(options) {
    retrieveConfig(false, !!options.mdebug, function(mimosaConfig) {
      var logger = generateLoggerProxy(mimosaConfig.log);
      logger.info('Removing all comparison and failure screenshots');
      clean(mimosaConfig.phantomcss.screenshotDirectory, '**/*.{fail,diff}.png', logger);
    });
  }

  function commandGenerateTests(options) {
    retrieveConfig(false, !!options.mdebug, function(mimosaConfig) {
      var logger = generateLoggerProxy(mimosaConfig.log);
      generateTests(mimosaConfig.phantomcss, logger);
    });
  }

  function commandRunAllTests(options) {
    retrieveConfig(false, !!options.mdebug, function(mimosaConfig) {
      var logger = generateLoggerProxy(mimosaConfig.log);

      if (options.rebaseline) {
        logger.info('Clearing old baseline');
        clean(mimosaConfig.phantomcss.screenshotDirectory, '**/*.png', logger);
      }

      if (options.verbose) {
        logger.debug('Enabling `verbose` flag');
        mimosaConfig.phantomcss.verbose = true;
      }

      execute(mimosaConfig.phantomcss, logger);
    });
  }
}

/**
 * Registers a workflow operation for the PhantomCSS execution, if enabled.
 *
 * @param  {object} mimosaConfig
 * @param  {function} register
 */
function registration(mimosaConfig, register) {

  /*
   * Notes:
   * 2015-02-06 ddb: Disabling until a good plan for build integration presents itself.
   */

  // var logger = generateLoggerProxy(mimosaConfig.log);
  // var config = mimosaConfig.phantomcss;

  // if (config.enabledOnBuild && mimosaConfig.isBuild) {
  //   register(['postBuild'], 'beforePackage', function(mimosaConfig, options, next) {
  //     execute(config, logger, function(allTestsPassed) {
  //       if (!allTestsPassed) {
  //         if (config.shouldStopBuildOnFailure || mimosaConfig.exitOnError) {
  //           logger.error('Build is broken; Exiting.');
  //           process.exit(1);
  //         } else {
  //           logger.warn('There were failures in some visual tests');
  //         }
  //       }

  //       next();
  //     });
  //   });
  // }
}

module.exports = {
  registration: registration,
  registerCommand: registerCommand,
  defaults: config.defaults,
  validate: config.validate
};
