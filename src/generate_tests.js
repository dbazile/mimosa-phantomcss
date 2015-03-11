var fs = require('fs');
var path = require('path');

var config = '{\n' +
             '  "url": "http://getbootstrap.com/examples/navbar/",\n' +
             '  "viewport": {\n' +
             '    "width": 1200,\n' +
             '    "height": 600\n' +
             '  },\n' +
             '  "init": {\n' +
             '    "libraryRoot": "$PATH_TO_PHANTOMCSS_HOME",\n' +
             '    "screenshotRoot": ".mimosa/phantomcss/screenshots",\n' +
             '    "failedComparisonsRoot": ".mimosa/phantomcss/screenshots/failures",\n' +
             '    "addLabelToFailedImage": false,\n' +
             '    "outputSettings": {\n' +
             '      "transparency": 0.5\n' +
             '    }\n' +
             '  }\n' +
             '}\n';

var test1 = "var phantomcss = require('phantomcss');\n" +
            "var config = require('./config.json');\n" +
            "\n" +
            "phantomcss.init(config.init);\n" +
            "\n" +
            "casper\n" +
            "  .start(config.url)\n" +
            "  .viewport(config.viewport.width, config.viewport.height);\n" +
            "\n" +
            "casper.then(function() {\n" +
            "  phantomcss.screenshot('body', 'interaction/dropdown/before_click');\n" +
            "});\n" +
            "\n" +
            "casper.then(function() {\n" +
            "  casper.click('#navbar > ul:nth-child(1) > li.dropdown > a');\n" +
            "  phantomcss.screenshot('body', 'interaction/dropdown/after_click');\n" +
            "});\n" +
            "\n" +
            "casper.then(function() {\n" +
            "  phantomcss.compareSession();\n" +
            "});\n" +
            "\n" +
            "casper.then(function() {\n" +
            "  casper.test.done();\n" +
            "});\n" +
            "\n" +
            "casper.run(function() {\n" +
            "  phantom.exit(phantomcss.getExitStatus());\n" +
            "});\n";

/**
 * Main operation.
 *
 * @param  {object} config         The phantomcss node from mimosaConfig
 * @param  {object} loggerInstance An instance of the mimosa logger object
 */
function main(options, logger) {

  // Add the PhantomCSS npm module home to the config
  var phantomcssHome = path.relative(process.cwd(), options.libraries.phantomcss);
  config = config.replace('$PATH_TO_PHANTOMCSS_HOME', phantomcssHome);

  write('config.json', config);
  write('example_test.js', test1);

  /**
   * Writes a file to disk.
   *
   * @param  {string} filename
   * @param  {string} contents
   */
  function write(filename, contents) {
    var filepath = path.join(options.testDirectory, filename);

    logger.debug('Before write to [[ %s ]]', filepath);
    fs.writeFile(filepath, contents, function(err) {
      if (err) {
        logger.error('Could not write to [[ ' + filepath + ' ]]:', err);
      } else {
        logger.success('Created file [[ ' + filepath + ' ]]');
      }
    });
  }
}

module.exports = main;
