var path = require('path');
var child = require('child_process');
var glob = require('glob');

var numberOfRunningTests = 0;
var numberOfFailures = 0;
var casperExecutionOptions;
var isVerbose, logger, onAllTestsComplete;

/**
 * Adds required library binaries to the system environment PATH.
 *
 * @param  {Object} libraries  An object whose properties contain string paths for each required library
 */
function appendLibrariesToPath(libraries) {
  var _normalize = function (s) { return path.resolve(path.join(s, 'bin')); };
  logger.debug('Appending libraries to process.env.PATH');
  process.env.PATH = _normalize(libraries.casperjs) + path.delimiter + process.env.PATH;
  process.env.PATH = _normalize(libraries.phantomcss) + path.delimiter + process.env.PATH;
  process.env.PATH = _normalize(libraries.phantomjs) + path.delimiter + process.env.PATH;
}

/**
 * Executes a test synchronously.
 *
 * @param  {String} filepath  Path to the CasperJS test script
 */
function executeSync(filepath) {
  var command = generateCasperCommand(filepath);
  var stdout;

  logger.info('Starting [[ %s ]]...', filepath);
  logger.debug('Before executing (synchronously):\n[[ %s ]]', command);

  try {
    stdout = child.execSync(command);
  } catch (e) {
    stdout = e.stdout;
  } finally {
    onExecuteComplete(filepath, stdout.toString());
  }
}

/**
 * Executes a test asynchronously.
 *
 * @param  {String} filepath  Path to the CasperJS test script
 */
function execute(filepath) {
  var command = generateCasperCommand(filepath);

  logger.info('Starting [[ %s ]]...', filepath);
  logger.debug('Before executing:\n[[ %s ]]', command);

  child.exec(command, function(_, stdout) {
    onExecuteComplete(filepath, stdout);
  });
}

/**
 * Returns the command string to be executed.
 *
 * @param  {String} filepath  Path to the CasperJS test script
 * @return {String}
 */
function generateCasperCommand(filepath) {
  return 'casperjs test "' + filepath + '" ' + casperExecutionOptions;
}

/**
 * Main operation.
 *
 * @param  {Object} config         The phantomcss node from mimosaConfig
 * @param  {Object} loggerInstance An instance of the mimosa logger object
 * @param  {Function?} onComplete  A callback to be executed after all tests complete
 */
function main(config, loggerInstance, onComplete) {
  var directory = config.testDirectory;
  var pattern = config.testPattern;

  // Save these for later usage
  logger = loggerInstance;
  isVerbose = config.verbose;
  casperExecutionOptions = config.executionOptions.join(' ');
  onAllTestsComplete = onComplete;

  // Executing casperjs test requires the library binaries to be on the system PATH
  appendLibrariesToPath(config.libraries);

  // Find and execute test files
  logger.debug('Globbing files: [[ %s/%s ]]', directory, pattern);
  glob(path.join(directory, pattern), function(_, files) {
    numberOfRunningTests = files.length;
    if (files.length) {
      files.forEach(config.synchronous ? executeSync : execute);
    } else {
      logger.info('No test files found in [[ %s ]]', directory);
    }
  });
}

/**
 * Called whenever the execution of a test script completes.
 *
 * @param  {String} filepath Path to the CasperJS test script
 * @param  {String} stdout
 */
function onExecuteComplete(filepath, stdout) {
  logger.debug('After executing [[ casperjs test %s ]]', filepath);

  // Fail fast if there was an execution error in a test script
  if (-1 !== stdout.indexOf('error: ')) {
    logger.error('Encountered error in [[ %s ]]:\n%s\n\n', filepath, stdout);
    process.exit(1);
  }

  // Tally the successes and failures for this execution
  var report = scrapeOutput(stdout);

  // Emit appropriate log messages
  if (isVerbose) {
    logger.info('Verbose output for [[ %s ]]:\n%s\n\n', filepath, stdout);
  } else {
    logBaselinedImages(report.baseline, filepath);
    logFailedImages(report.failures, filepath);
    logReportSummary(report, filepath);
  }

  postProcessing(report);
}

/**
 * Perform any final processing for this execution.
 *
 * @param report {Object}
 */
function postProcessing(report) {

  // Update the metrics
  numberOfFailures += report.failures.length;
  numberOfRunningTests -= 1;

  // Notify main()'s callback if there are no more tests
  if (0 === numberOfRunningTests && typeof onAllTestsComplete === 'function') {
    var successful = (0 === numberOfFailures);

    onAllTestsComplete(successful);
  }
}

/**
 * Emits log entries for each baseline created.
 *
 * @param  {String[]} images  A list of screenshot paths
 * @param  {String} filepath  Path to the CasperJS test script
 */
function logBaselinedImages(images, filepath) {
  var filename = path.basename(filepath);
  images.forEach(function(image) {
    logger.success(filename + ': Baselined [[ ' + image + ' ]]');
  });
}

/**
 * Emits log entries for each failure.
 *
 * @param  {String[]} images  A list of screenshot paths
 * @param  {String} filepath  Path to the CasperJS test script
 */
function logFailedImages(images, filepath) {
  var filename = path.basename(filepath);
  images.forEach(function(image) {
    logger.error(filename + ': Failed [[ ' + image + ' ]]');
  });
}

/**
 * Emits a summarized report based on the execution results for a single test script.
 *
 * @param  {Object} report   A simple hash containing arrays of passed, failed and baselined screenshots
 * @param  {String} filepath The path to the test file that executed
 */
function logReportSummary(report, filepath) {
  if (0 === report.failures.length) {

    // No Failures

    if (report.passes.length) {

      // At least one Pass
      logger.success('[[ ' + filepath + ' ]]: All tests passed in ' + report.duration + 's');

    } else if (!report.baseline.length) {

      // No Failures, no Passes and no Baselines -- did anything happen?
      logger.info('[[ %s ]]: Executed, but no visual tests ran (try running again with -v flag to see the raw casperjs output)', filepath);

    }
  }
}

/**
 * Converts raw STDOUT from a CasperJS into a simplified report object.
 *
 * @param  {String} stdout Raw STDOUT string
 * @return {Object}
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
