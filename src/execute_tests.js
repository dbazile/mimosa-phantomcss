var path = require('path');
var child = require('child_process');
var glob = require('glob');

var numberOfRunningTests = 0;
var numberOfFailures = 0;
var isVerbose, logger, onAllTestsComplete;

/**
 * Called after each CasperJS script finishes execution.
 *
 * @param {string} filepath The path to the script that just executed
 */
function afterExecute(filepath) {
  --numberOfRunningTests;
  if (0 === numberOfRunningTests && typeof onAllTestsComplete === 'function') {
    onAllTestsComplete(0 === numberOfFailures);
  }
}

/**
 * Adds required library binaries to the system environment PATH.
 *
 * @param  {object} libraries  An object whose properties contain string paths for each required library
 */
function appendLibrariesToPath(libraries) {
  var _normalize = function (s) { return path.resolve(path.join(s, 'bin')); };
  logger.debug('Appending libraries to process.env.PATH');
  process.env.PATH = _normalize(libraries.casperjs) + path.delimiter + process.env.PATH;
  process.env.PATH = _normalize(libraries.phantomcss) + path.delimiter + process.env.PATH;
  process.env.PATH = _normalize(libraries.phantomjs) + path.delimiter + process.env.PATH;
}

/**
 * Runs a given script with `casperjs test`.
 *
 * @param  {string} filepath
 */
function executeScriptWithCasper(filepath) {

  // Since these tests might be very slow to return results, give the user some feedback
  logger.info('Starting [[ %s ]]...', filepath);

  logger.debug('Before executing [[ %s ]]', filepath);
  child.exec('casperjs test "' + filepath + '"', function(error, stdout, stderr) {
    logger.debug('After executing [[ casperjs test %s ]]', filepath);

    if (isVerbose) {
      logger.info('Verbose output for [[ %s ]]:\n%s\n\n', filepath, stdout);
    } else if (-1 !== stdout.indexOf('error: ')) {
      logger.error('Encountered error in [[ %s ]]:\n%s\n\n', filepath, stdout);

      // Fail fast if there was an execution error in a test script
      process.exit(1);

    } else {
      var filename = path.basename(filepath);
      var report = scrapeOutput(stdout);

      // Explicitly identify any new baseline images
      report.baseline.forEach(function(screenshot, i) {
        logger.success(filename + ': Baselined [[ ' + screenshot + ' ]]');
      });

      // Explicitly call out any failures
      report.failures.forEach(function(screenshot) {
        ++numberOfFailures;
        logger.error(filename + ': Failed [[ ' + screenshot + ' ]]');
      });

      reportFinalStatus(report, filepath);
    }

    afterExecute(filepath);
  });
}

/**
 * Main operation.
 *
 * @param  {object} config         The phantomcss node from mimosaConfig
 * @param  {object} loggerInstance An instance of the mimosa logger object
 * @param  {function?} callback    Invoked after all tests complete.  Args: (allTestsPassed: bool)
 */
function main(config, loggerInstance, callback) {
  var directory = config.testDirectory;
  var pattern = config.testPattern;

  // Save these for later usage
  logger = loggerInstance;
  isVerbose = config.verbose;
  onAllTestsComplete = callback;

  // Executing casperjs test requires the library binaries to be on the system PATH
  appendLibrariesToPath(config.libraries);

  // Find and execute test files
  logger.debug('Globbing files: [[ %s/%s ]]', directory, pattern);
  glob(path.join(directory, pattern), function(err, files) {
    numberOfRunningTests = files.length;
    if (files.length) {
      files.forEach(executeScriptWithCasper);
    } else {
      logger.info('No test files found in [[ %s ]]', directory);
    }
  });
}

/**
 * Generates a sensible report based on the execution results for a single test script.
 *
 * @param  {object} report   A simple hash containing arrays of passed, failed and baselined screenshots
 * @param  {string} filepath The path to the test file that executed
 */
function reportFinalStatus(report, filepath) {
  var filename = path.basename(filepath);
  if (0 === report.failures.length) {

    // No Failures

    if (report.passes.length) {

      // At least one Pass
      logger.success('[[ ' + filepath + ' ]]: All tests passed in ' + report.duration + 's');

    } else if (!report.baseline.length) {

      // No Failures, no Passes and no Baselines -- did anything happen?
      logger.info('[[ %s ]]: Executed, but no visual tests ran (try running again with -v flag to see the raw casperjs output)', filename);

    }
  }
}

/**
 * Converts raw STDOUT from a CasperJS into a simplified report object.
 *
 * @param  {string} stdout Raw STDOUT string
 * @return {object}
 */
function scrapeOutput(stdout) {
  var PATTERN_PASS = /PASS No changes found for screenshot (.*)$/;
  var PATTERN_FAIL = /Failure! Saved to (.*)$/;
  var PATTERN_REPORTCARD = /^(PASS|FAIL) (\d+) tests? executed in ([^,]+)s, (\d+) passed, (\d+) failed, (\d+) dubious, (\d+) skipped.$/;
  var PATTERN_NEW_SCREENSHOT = /^New screenshot at (.*)$/;

  var report = {
    baseline: [],
    passes: [],
    failures: [],
    duration: 0,
    counts: {
      dubious: 0,
      skipped: 0
    }
  };

  stdout
    .replace(/\u001b\[.*?m/g, '')
    .split("\n")
    .forEach(function(line) {
      line = line.trim();
      var chunks;

      if ((chunks = line.match(PATTERN_PASS))) {
        report.passes.push(chunks[1]);
      } else if ((chunks = line.match(PATTERN_FAIL))) {
        report.failures.push(chunks[1]);
      } else if ((chunks = line.match(PATTERN_REPORTCARD))) {
        report.duration = parseFloat(chunks[3]);
        report.counts.dubious += parseInt(chunks[6], 10);
        report.counts.skipped += parseInt(chunks[7], 10);
      } else if ((chunks = line.match(PATTERN_NEW_SCREENSHOT))) {
        report.baseline.push(chunks[1]);
      }
    });

  return report;
}

module.exports = main;
