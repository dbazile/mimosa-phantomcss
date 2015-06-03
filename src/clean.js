var fs = require('fs');
var glob = require('glob');
var path = require('path');

/**
 * Try to keep the user from blasting off their foot.
 *
 * @param  {string}  pattern Glob pattern
 * @return {Boolean}
 */
function isUnsafePattern(pattern) {
  var startsWithDotDot = /^\.\./;
  var startsWithSlash = /^\//;

  return startsWithSlash.test(pattern) || startsWithDotDot.test(pattern);
}

/**
 * Main operation.
 *
 * @param  {string} directory The root directory to search from
 * @param  {string} pattern   A glob pattern to use relative to the specified directory
 * @param  {object} logger    An instance of the mimosa logger object
 */
function main(directory, pattern, logger) {
  pattern = pattern.trim();

  if (false === isUnsafePattern(pattern)) {
    logger.debug('Globbing files: [[ %s/%s ]]', directory, pattern);

    glob
      .sync(path.join(directory, pattern))
      .forEach(function(filepath) {
        try {
          fs.unlinkSync(filepath);
          logger.debug('Unlinked: [[ %s ]]', filepath);
        } catch (error) {
          logger.error('Unlink failed: [[ (%s) %s ]]', err.code, err.path);
        }
      });
  } else {
    logger.warn('Will not clean unsafe glob pattern; [[ %s ]] will find files outside of the target directory (%s)', pattern, directory);
  }
}

module.exports = main;
