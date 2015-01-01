'use strict';

module.exports = function(grunt) {
  // Unified Watch Object
  var watchFiles = {
    serverViews: ['app/views/**/*.*'],
    serverJS: ['gruntfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js'],
    clientViews: ['public/modules/**/views/**/*.html'],
    clientJS: ['public/js/*.js', 'public/modules/**/*.js'],
    clientCSS: ['public/modules/**/*.css'],
    clientSCSS: ['public/modules/**/*.scss'],
    clientLESS: ['public/modules/**/*.less'],
    mochaTests: ['app/tests/**/*.js']
  };

  // Project Configuration
  grunt.initConfig({
    copy: {
      main: {
        expand: true,
        flatten: true,
        src: ['public/modules/dashboard/fonts/*'],
        dest: 'public/fonts',
        filter: 'isFile'
      }
    },
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      serverViews: {
        files: watchFiles.serverViews,
        options: {
          spawn: false,
          livereload: {
            port: 35728,
            key: grunt.file.read('config/sslcerts/key.pem'),
            cert: grunt.file.read('config/sslcerts/cert.pem')
          }
        }
      },
      serverJS: {
        files: watchFiles.serverJS,
        tasks: ['jshint'],
        options: {
          spawn: false,
          livereload: {
            port: 35728,
            key: grunt.file.read('config/sslcerts/key.pem'),
            cert: grunt.file.read('config/sslcerts/cert.pem')
          }
        }
      },
      clientViews: {
        files: watchFiles.clientViews,
        options: {
          spawn: false,
          livereload: {
            port: 35728,
            key: grunt.file.read('config/sslcerts/key.pem'),
            cert: grunt.file.read('config/sslcerts/cert.pem')
          }
        }
      },
      clientJS: {
        files: watchFiles.clientJS,
        tasks: ['jshint'],
        options: {
          spawn: false,
          livereload: {
            port: 35728,
            key: grunt.file.read('config/sslcerts/key.pem'),
            cert: grunt.file.read('config/sslcerts/cert.pem')
          }
        }
      },
      clientCSS: {
        files: watchFiles.clientCSS,
        tasks: ['csslint'],
        options: {
          spawn: false,
          livereload: {
            port: 35728,
            key: grunt.file.read('config/sslcerts/key.pem'),
            cert: grunt.file.read('config/sslcerts/cert.pem')
          }
        }
      },
      clientSCSS: {
        files: watchFiles.clientSCSS,
        tasks: ['sass', 'csslint'],
        options: {
          livereload: {
            port: 35728,
            key: grunt.file.read('config/sslcerts/key.pem'),
            cert: grunt.file.read('config/sslcerts/cert.pem')
          }
        }
      },
      clientLESS: {
        files: watchFiles.clientLESS,
        tasks: ['less', 'csslint'],
        options: {
          livereload: {
            port: 35728,
            key: grunt.file.read('config/sslcerts/key.pem'),
            cert: grunt.file.read('config/sslcerts/cert.pem')
          }
        }
      }
    },
    jshint: {
      all: {
        src: watchFiles.clientJS.concat(watchFiles.serverJS),
        options: {
          jshintrc: true
        }
      }
    },
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      all: {
        src: watchFiles.clientCSS
      }
    },
    uglify: {
      production: {
        options: {
          mangle: true
        },
        files: {
          'public/dist/application.min.js': 'public/dist/application.js'
        }
      }
    },
    cssmin: {
      combine: {
        files: {
          'public/dist/application.min.css': '<%= applicationCSSFiles %>'
        }
      }
    },
    sass: {
      dist: {
        files: [{
          expand: true,
          src: watchFiles.clientSCSS,
          ext: '.css',
          rename: function(base, src) {
            return  src.replace('/scss/', '/css/');
          }
        }]
      }
    },
    less: {
      dist: {
        files: [{
          expand: true,
          src: watchFiles.clientLESS,
          ext: '.css',
          rename: function(base, src) {
            return  src.replace('/less/', '/css/');
          }
        }]
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          nodeArgs: ['--debug'],
          ext: 'js,html',
          watch: watchFiles.serverViews.concat(watchFiles.serverJS)
        }
      }
    },
    'node-inspector': {
      custom: {
        options: {
          'web-port': 1337,
          'web-host': 'localhost',
          'debug-port': 5858,
          'save-live-edit': true,
          'no-preload': true,
          'stack-trace-limit': 50,
          'hidden': []
        }
      }
    },
    ngAnnotate: {
      production: {
        files: {
          'public/dist/application.js': '<%= applicationJavaScriptFiles %>'
        }
      }
    },
    ngconstant: {
      options: {
        name: 'constants',
        dest: 'public/modules/core/services/constants.js',
        constants: {
          ENV: {
            stripeImage: undefined,
            stripePublicKey: undefined
          }
        }
      },
      development: {
        constants: {
          ENV: {
            stripeImage: 'https://localhost:3000/modules/core/img/brand/favicon.ico',
            stripePublicKey: 'pk_test_WMSaxecz5HSTGZxlFbuxdF7B'
          }
        }
      },
      test: {
        constants: {
          ENV: {
            stripeImage: 'https://localhost:3000/modules/core/img/brand/favicon.ico',
            stripePublicKey: 'pk_test_WMSaxecz5HSTGZxlFbuxdF7B'
          }
        }
      },
      production: {
        constants: {}
      }
    },
    concurrent: {
      default: ['ngconstant:development', 'nodemon', 'watch'],
      development: ['ngconstant:development', 'nodemon', 'watch'],
      test: ['ngconstant:test', 'nodemon', 'watch'],
      production: ['ngconstant:production', 'nodemon', 'watch'],
      debug: ['nodemon', 'watch', 'node-inspector'],
      options: {
        logConcurrentOutput: true
      }
    },
    env: {
      test: {
        NODE_ENV: 'test'
      }
    },
    mochaTest: {
      src: watchFiles.mochaTests,
      options: {
        reporter: 'spec',
        require: 'server.js'
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    }
  });

  // Load NPM tasks
  require('load-grunt-tasks')(grunt);

  // Making grunt default to force in order not to break the project.
  grunt.option('force', !process.env.WERCKER || false);

  // A Task for loading the configuration object
  grunt.task.registerTask(
    'loadConfig',
    'Task that loads the config into a grunt option.',
    function() {
      var init = require('./config/init')();
      var config = require('./config/config');

      grunt.config.set('applicationJavaScriptFiles', config.assets.js);
      grunt.config.set('applicationCSSFiles', config.assets.css);
    }
  );

  // A Task for populating test data into the database
  require('./populate-test-data')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['lint', 'concurrent:default']);

  // Debug task.
  grunt.registerTask('debug', ['lint', 'concurrent:debug']);

  // Lint task(s).
  grunt.registerTask('lint', ['sass', 'less', 'jshint', 'csslint']);

  // Build task(s).
  grunt.registerTask('build', ['lint', 'loadConfig', 'ngAnnotate', 'uglify', 'cssmin', 'copy']);

  // Test task.
  grunt.registerTask('test', ['env:test', 'mochaTest', 'karma:unit']);

  // flow task
  grunt.loadNpmTasks('grunt-flow-type-check');

  // ng-constant for dynamically generating constant values
  grunt.loadNpmTasks('grunt-ng-constant');
};
