exports.config =
  modules: ['jshint', 'copy']
  watch:
    sourceDir: 'src'
    compiledDir: 'lib'
    javascriptDir: null
  jshint:
    rules:
      node: true
