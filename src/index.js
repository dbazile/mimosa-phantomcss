'use strict';

var config = require('./config');
var clean = require('./clean');
var execute = require('./execute_tests');
var generateTests = require('./generate_tests');

/**
 * Applies a list of glob modifiers to the test pattern.
 *
 * @param  {string[]} filters
 * @param  {object}   config   mimosa-phantomcss config object
 */
function applyFiltersToTestPattern(filters, config, logger) {
  var filterString = filters.join(',');
  if (filters.length > 1) {
    filterString = '{' + filterString + '}';
  }

  logger.info('Filtering tests by [[ %s ]]', filters);
  config.testPattern = config.filteredTestPatternTemplate.replace('____FILTERS____', filterString);
}

/**
 * Extracts CLI arguments for a mimosa command.  This is done to work around
 * the lack of variadic arguments in Commander.js 1.3 (used in Mimosa as of
 * v.2.x).
 *
 * @param  {arguments} args
 * @return {array}
 */
function extractFilters(args) {
  return Array.prototype.slice.call(args, 0, args.length - 1);
}

/**
 * Extracts CLI options for a mimosa command.  This is done to work around the
 * lack of variadic arguments in Commander.js 1.3 (used in Mimosa as of v.2.x).
 *
 * @param  {arguments} args
 * @return {array}
 */
function extractOptions(args) {
  return args[args.length - 1];
}

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
 * @param {object}   program         Commander.js object
 * @param {object}   logger          Mimosa logger
 * @param {function} retrieveConfig  Mimosa callback
 */
function registerCommand(program, logger, retrieveConfig) {
  program
    .command('phantomcss')
    .usage('[options] [filters...]')
    .option('-c, --clean',      'Cleans all .diff and .fail screenshots from the screenshot directory before executing tests')
    .option('-r, --rebaseline', 'Rebuilds all baseline screenshots for all tests')
    .option('-s, --sync',       'Execute tests synchronously')
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

  function commandRunAllTests() {
    var filters = extractFilters(arguments);
    var options = extractOptions(arguments);
    var runOptions = {
      buildFirst: false,
      mdebug: !!options.mdebug
    };

    retrieveConfig(runOptions, function(mimosaConfig) {

      if (filters.length) {
        applyFiltersToTestPattern(filters, mimosaConfig.phantomcss, loggerProxy);
      }

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

      if (options.sync) {
        loggerProxy.debug('Enabling `synchronous` flag');
        mimosaConfig.phantomcss.synchronous = true;
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
