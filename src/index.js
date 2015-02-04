'use strict';

var config = require('./config');
var clean = require('./clean');
var execute = require('./execute_tests');

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
    .command('test:phantomcss')
    .option('-r, --rebaseline', 'Rebuilds any baseline screenshots.')
    .option('-c, --clean',      'Clean the .diff and .fail screenshots from the comparison results.')
    .option('-v, --verbose',    'Directly dumps the CasperJS output to the console')
    .description('Run PhantomCSS visual inspection tests')
    .action(function(options) {
      var flags = {
        buildFirst: false, // Does this make sense?  In most cases, won't this be used against a running `watch`?
        mdebug: false
      };

      retrieveConfig(flags, function(mimosaConfig) {
        var logger = generateLoggerProxy(mimosaConfig.log);

        if (options.rebaseline || options.clean) {
          var cleanupPattern, cleanupMessage;

          if (options.rebaseline) {
            cleanupMessage = 'Clearing old baseline';
            cleanupPattern = '**/*.png';
          } else {
            cleanupMessage = 'Clearing failures and diffs';
            cleanupPattern = '**/*.{diff,fail}.png';
          }

          logger.info(cleanupMessage);
          clean(mimosaConfig.phantomcss.screenshotDirectory, cleanupPattern, logger);
        }

        if (options.verbose) {
          logger.debug('Enabling `verbose` flag');
          mimosaConfig.phantomcss.verbose = true;
        }

        execute(mimosaConfig.phantomcss, logger);
      });
    });
}

module.exports = {
  registerCommand: registerCommand,
  defaults: config.defaults,
  validate: config.validate
};
