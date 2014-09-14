var fs = require('fs');

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit : {
      all : ["test/*.js"]
    },
    mochaTest: {
      test: {
        options: {
          globals:  ['should'],
          colors:   true,
          reporter: 'spec'
        },
        src: ['test/*.js']
      }
    },
    jshint: {
      all: ["Gruntfile.js", "moment.js", "lang/**/*.js", "test/**/*.js"],
      options: {
        "node"     : true,
        "browser"  : true,
        "boss"     : true,
        "curly"    : true,
        "debug"    : false,
        "devel"    : false,
        "eqeqeq"   : true,
        "eqnull"   : true,
        "evil"     : false,
        "forin"    : false,
        "immed"    : false,
        "laxbreak" : false,
        "newcap"   : true,
        "noarg"    : true,
        "noempty"  : false,
        "nonew"    : false,
        "onevar"   : true,
        "plusplus" : false,
        "regexp"   : false,
        "undef"    : true,
        "sub"      : true,
        "strict"   : false
      }
    },
    watch : {
      test : {
        files : [
          'lib/treeize.js',
          'test/**/*.js'
        ],
        tasks: ['nodeunit']
      },
      jshint : {
        files : '<%= jshint.all %>',
        tasks: ['jshint']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  // Default task.
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['jshint', 'test', 'watch']);
};
