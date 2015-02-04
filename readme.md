mimosa-phantomcss
=================

## Overview

This module provides a simple execution wrapper around [PhantomCSS](https://github.com/Huddle/PhantomCSS).  It includes everything needed to get started without having to install PhantomJS, CasperJS and PhantomCSS globally.



## Usage

1. Add `'mimosa-phantomcss'` to your list of modules.
2. From the command line, execute `mimosa test:phantomcss` to run your tests.  Using the default configuration, any PhantomCSS test scripts in `assets/javascripts/tests/visual` will be executed and screenshots will be created in `.mimosa/phantomcss/screenshots`.

If you get the following error:

```
15:01:06 - ERROR - Unable to start Mimosa for the following reason(s):
 * phantomcss.libraries.casperjs ./node_modules/phantomcss/node_modules/casperjs cannot be found
 * phantomcss.libraries.phantomcss ./node_modules/phantomcss cannot be found
 * phantomcss.libraries.phantomjs ./node_modules/phantomcss/node_modules/phantomjs cannot be found
```

That just means you need to run `npm install phantomcss --save-dev` to grab the PhantomCSS module.

### Example test script to get you going

```javascript
var phantomcss = require('phantomcss');

phantomcss.init({
  libraryRoot: 'node_modules/phantomcss',
  screenshotRoot: '.mimosa/phantomcss/screenshots',
  failedComparisonsRoot: '.mimosa/phantomcss/screenshots/failures',
});

casper
  .start('http://www.alistapart.com')
  .viewport(1024, 768);

casper.then(function() {
  phantomcss.screenshot('body', 'fullscreen/visited-index-and-did-nothing');
});

casper.then(function() {
  phantomcss.compareSession();
});

casper.then(function() {
  casper.test.done();
});

casper.run(function() {
  phantom.exit(phantomcss.getExitStatus());
});
```

### Need to rebuild the entire baseline?

Run `mimosa test:phantomcss -r` to rebuild all baseline screenshots located in the screenshot directory.

*Be careful, because running this command* ***wipes out all of the .png files in the directory identified by the `phantomcss.screenshotDirectory` configuration.***

### Need to see the CasperJS output?

Either set `phantomcss.verbose` to `true` or use the `-v` flag, e.g., `mimosa test:phantomcss -v`.



## Default Config

```javascript
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
```

### `phantomcss.verbose` boolean

Setting this property to `true` will always print out the raw CasperJS output to the console.  This is the same as running the command with the `-v` flag.

### `phantomcss.testDirectory` string

This is the directory where your PhantomCSS test scripts live.

### `phantomcss.testPattern` string

A glob that will be used to find the test script files to be executed.

### `phantomcss.screenshotDirectory` string

This is the directory where you will be creating screenshots.

*Be careful where you point this; running `mimosa test:phantomcss -r`* ***wipes out all of the .png files in this directory.***

### `phantomcss.libraries.casperjs` string

This is the path where the CasperJS node module lives.

### `phantomcss.libraries.phantomcss` string

This is the path where the PhantomCSS node module lives.

### `phantomcss.libraries.phantomjs` string

This is the path where the PhantomJS node module lives.

