module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    },
    copy: {
      configfile: {
        files: [ {src: ['config.js.sample'], dest: 'config.js' } ]
      }
    },
    shell: {
      // Generate documentation
      makeDocs: {
        command: 'rm -Rf public/docs/* && doxx --source . --ignore "public,static,views,templates,node_modules,grunt,config" --target public/docs'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        es5: true,
        strict: false
      },
      globals: {
        jQuery: true
      },
      uses_defaults: [ '*.js', 'lib/**/*.js', 'test/**/*.js' ]
    } 
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['jshint', 'shell:makeDocs']);
  grunt.registerTask('install', ['jshint', 'shell:makeDocs', 'copy:configfile']);

};
