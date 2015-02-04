var fs = require('fs');
var glob = require('glob');
var path = require('path');

module.exports = function main(directory, pattern, logger) {
  pattern = pattern.trim();

  if (false === isUnsafePattern(pattern)) {
    logger.debug('Globbing files: [[ %s/%s ]]', directory, pattern);

    glob(path.join(directory, pattern), function(err, files) {
      files.forEach(function(filepath) {
        fs.unlink(filepath, function(err) {
          if (err) {
            logger.error('Unlink failed: [[ (%s) %s ]]', err.code, err.path);
          } else {
            logger.debug('Unlinked: [[ %s ]]', filepath);
          }
        });
      });
    });
  } else {
    logger.warn('Will not clean unsafe glob pattern; [[ %s ]] will find files outside of the target directory (%s)', pattern, directory);
  }
};

function isUnsafePattern(pattern) {
  var startsWithDotDot = /^\.\./;
  var startsWithSlash = /^\//;

  return startsWithSlash.test(pattern) || startsWithDotDot.test(pattern);
}
