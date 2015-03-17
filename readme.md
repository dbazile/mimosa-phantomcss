mimosa-phantomcss
=================

## Overview

This module provides a simple execution wrapper around [PhantomCSS](https://github.com/Huddle/PhantomCSS).  It includes everything needed to get started without having to install PhantomJS, CasperJS and PhantomCSS globally.



## Usage

1. Add `'mimosa-phantomcss'` to your list of modules.

2. Run **`mimosa phantomcss:gen`** to create example test(s) in `assets/javascripts/tests/visual`.

3. Run **`mimosa phantomcss`**.  The test(s) created by step 2 should be found and executed.



### Need to rebuild the entire baseline?

Run **`mimosa phantomcss -r`** to rebuild all baseline screenshots located in the screenshot directory.

> *Caution: This command deletes all of the `.png` files in the directory identified by `mimosaConfig.phantomcss.screenshotDirectory`*.

### Need to remove the `.diff` and `.fail` files?

Run **`mimosa phantomcss:clean`** to remove all of the comparison images from the screenshot directory.

This can also optionally be done by using the `-c` flag with the regular run command, e.g., **`mimosa phantomcss -c`**

### Need to see the raw CasperJS output?

Either set *`mimosaConfig.phantomcss.verbose`* to `true` or use the `-v` flag, e.g., **`mimosa phantomcss -v`**.




## Functionality

mimosa-phantomcss will search the directory identified by *`mimosaConfig.phantomcss.testDirectory`* and execute any test scripts it finds, based on the file extension and name suffix.

As an example, all of the following files would be found and automatically executed:

* `path/to/tests/` **`foo_test.js`**
* `path/to/tests/` **`foo_test.coffee`**
* `path/to/tests/` **`foo_spec.js`**
* `path/to/tests/` **`foo_spec.coffee`**
* `path/to/tests/` **`bar/boo/baz/foo_test.js`**

These scripts are essentially CasperJS scripts, so everything that you'd expect to be able to do in CasperJS should work.


# Default Config

```javascript
phantomcss: {
  verbose: false,
  testDirectory: 'assets/javascripts/tests/visual',
  testPattern: '**/*{test,spec}.{js,coffee}',
  screenshotDirectory: '.mimosa/phantomcss/screenshots',
  executionOptions: [],
  libraries: {
    casperjs: '/path/to/mimosa-phantomcss/node_modules/phantomcss/node_modules/casperjs',
    phantomcss: '/path/to/mimosa-phantomcss/node_modules/phantomcss',
    phantomjs: '/path/to/mimosa-phantomcss/node_modules/phantomcss/node_modules/phantomjs'
  }
}
```

#### `phantomcss.verbose` boolean

Setting this property to `true` will always print out the raw CasperJS output to the console.  This is the same as running every time with the `-v` flag.

#### `phantomcss.testDirectory` string

This is the directory where your PhantomCSS test scripts live.

#### `phantomcss.testPattern` string

A glob that will be used to find the test script files to be executed.

#### `phantomcss.screenshotDirectory` string

This is the directory where you will be creating screenshots.

> *Caution: Running `mimosa phantomcss -r` deletes all of the `.png` files in this directory.*

#### `phantomcss.executionOptions` string[]

This lets you specify any command-line options to be passed to CasperJS/PhantomJS, e.g.,

```
  executionOptions: ['--ignore-ssl-errors=true', '--cookies-file=/path/to/cookies.txt']
```

#### `phantomcss.libraries.casperjs` string

This is the path where the CasperJS node module lives.

#### `phantomcss.libraries.phantomcss` string

This is the path where the PhantomCSS node module lives.

#### `phantomcss.libraries.phantomjs` string

This is the path where the PhantomJS node module lives.

