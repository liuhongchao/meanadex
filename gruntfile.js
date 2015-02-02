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

  var dir = {
    source: 'public',
    output: 'public/dist',
    bower:  'public/lib'
  };

  // Project Configuration
  grunt.initConfig({
    copy: {
      dist: {
        files: [
          {
            expand: true,
            dot: true,
            cwd: dir.source,
            dest: dir.output,
            src: [
              '*.html',
              'robots.txt',
              'humans.txt',
            ]
          },
          {
            expand: true,
            dot: true,
            cwd: dir.bower + '/font-awesome',
            dest: dir.output,
            src: [
              'fonts/*.*'
            ]
          },
          {
            expand: true,
            dot: true,
            cwd: dir.bower + '/bootstrap',
            dest: dir.output,
            src: [
              'fonts/*.*'
            ]
          },
          {
            expand: true,
            cwd: dir.source,
            dest: dir.output,
            src: [
              'fonts/*.*'
            ]
          },
          {
            expand: true,
            dot: true,
            cwd: dir.bower + '/slick-carousel/slick',
            dest: dir.output + '/css',
            src: [
              'slick.css.map'
            ]
          }
        ]
      }
    },
    clean: {
      dist: {
        files: [
          {
            dot: true,
            src: [
              dir.output + '/*',
              '!' + dir.output + '/uploads/**'
            ]
          }
        ]
      }
    },
    useminPrepare: {
      html: [dir.source + '/index.html'],
      options: {
        flow: {
          steps: {
            'js': ['concat'],
            'css': ['concat']
          },
          post: []
        },
        dest: dir.output
      }
    },
    concat: {
      js: {
        src: [
          dir.source + '/config.js',
          dir.source + '/application.js',
          dir.source + '/modules/*/*.js',
          dir.source + '/modules/*/*[!tests]*/*.js'
        ],
        dest: dir.output + '/js/application.js'
      },
      css: {
        src: [
          dir.source + '/modules/**/css/*.css'
        ],
        dest: dir.output + '/css/application.css'
      }
    },
    html2js: {
      options: {
        module: 'templates',
        base: dir.source
      },
      main: {
        src: [dir.source + '/modules/**/*.html'],
        dest: dir.output + '/js/templates.js'
      }
    },
    imagemin: {
      dist: {
        files: [
          {
            expand: true,
            cwd: dir.source + '/images',
            src: '**/*.{png,jpg,jpeg,ico,gif}',
            dest: dir.output + '/images'
          }
        ]
      }
    },
    usemin: {
      html: [
        dir.output + '/index.html'
      ],
      css: [
        dir.output + '/css/**/*.css'
      ],
      options: {
        dirs: [dir.output]
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
      options: {
        mangle: true
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: dir.output + '/js',
            src: '**/*.js',
            dest: dir.output + '/js'
          }
        ]
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: dir.output + '/css/',
        src: ['*.css'],
        dest: dir.output + '/css/'
      }
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          removeCommentsFromCDATA: true,
          collapseWhitespace: false,
          collapseBooleanAttributes: false,
          removeAttributeQuotes: false,
          removeRedundantAttributes: false,
          useShortDoctype: false,
          removeEmptyAttributes: true,
          removeOptionalTags: true
        },
        files: [
          {
            expand: true,
            cwd: dir.output,
            src: ['index.html'],
            dest: dir.output
          }
        ]
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
    concurrent: {
      default: ['nodemon', 'watch'],
      development: ['nodemon', 'watch'],
      test: ['nodemon', 'watch'],
      production: ['nodemon', 'watch'],
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

  // A Task for populating test data into the database
  require('./populate-test-data')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['build', 'concurrent:default']);

  // Debug task.
  grunt.registerTask('debug', ['build', 'concurrent:debug']);

  // Lint task(s).
  grunt.registerTask('lint', ['sass', 'less', 'jshint', 'csslint']);

  /**
   * Compiles all of our sources.
   */
  grunt.registerTask('compile', [
    'lint',
    'useminPrepare',
    'concat',
    'imagemin',
    'html2js',
    'copy:dist',
    'usemin'
  ]);

  /**
   * Package built code into a release package.
   */
  grunt.registerTask('package', [
    'uglify',
    'cssmin',
    'htmlmin'
  ]);

  // Build task(s).
  grunt.registerTask('build', ['clean', 'compile', 'package']);

  // Test task.
  grunt.registerTask('test', ['env:test', 'mochaTest', 'karma:unit']);

  // flow task
  grunt.loadNpmTasks('grunt-flow-type-check');
};
