/////////////////////////////////////////
//              VARIABLES              //
/////////////////////////////////////////
var PROJECT_NAME = 'forgrant_task',
    JQUERY_VERSION = 'jquery-3.2.1.min.js';

/* Global variables */
var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    beeper = require('beeper'),
    gutil = require('gulp-util'),
    chalk = require('chalk'),
    include = require("gulp-include"),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    rmEL = require('gulp-remove-empty-lines'),
    gulpif = require('gulp-if');

/* Server + FTP */
var browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    ftp = require('vinyl-ftp');

/* Templates */
var pug = require('gulp-pug'),
    emitty = require('emitty').setup('app', 'pug')
    prettify = require('gulp-jsbeautifier');

/* Styles */
var sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer');
/* Images + Sprites */
var spritesmith = require('gulp.spritesmith'),
    imagemin = require('gulp-imagemin');


/////////////////////////////////////////
//               TASKS                 //
/////////////////////////////////////////


/* ======================== */
/*       ERROR HANDLER      */
/* ======================== */
var plumberError = function (err) {
    beeper();
    gutil.log([(err.name + ' in ' + err.plugin), '', chalk.red(err.message), ''].join('\n'));
    this.emit('end');
};

/* ========================= */
/*            FTP            */
/* ========================= */
var FTP_PASS = require('./pass.js'),
    FTP_USER_HOST = FTP_PASS.host,
    FTP_USER_NAME = FTP_PASS.login,
    FTP_USER_PASSWORD = FTP_PASS.password,
    FTP_PATH = PROJECT_NAME;

gulp.task('upload', function () {
  var conn = ftp.create({
    host:     FTP_USER_HOST,
    user:     FTP_USER_NAME,
    password: FTP_USER_PASSWORD,
    parallel: 10,
    log:      gutil.log
  });

  var globs = [
    'build/css',
    'build/images',
    'build/js',
    'build/*.*'
  ];

  return gulp.src( globs, { buffer: false } )
    .pipe( conn.dest( FTP_PATH ) );
});

/* ========================= */
/*          SERVER           */
/* ========================= */
gulp.task('serve', function() {
    browserSync.init({
        server: {
            baseDir: './build'
        },
        ui: false,
        port: 8080,
        open: false,
        notify: false,
        // ghostMode: false,
        // logSnippet: false,
        // logLevel: "silent",
        // logFileChanges: false,
        reloadOnRestart: false,
        scrollProportionally: false
    });
});

/* ======================== */
/*            PUG           */
/* ======================== */
gulp.task('templates', function() {
    gulp.src(['app/templates/*.pug', '!app/templates/_*.pug'])
        .pipe(plumber({ errorHandler: plumberError }))
        .pipe(gulpif(global.watch, emitty.stream(global.emittyChangedFile)))
        .pipe(pug())
        .pipe(prettify({
            indent_level: 4,
            brace_style: "expand"
        }))
        .pipe(gulp.dest('build'))
        .pipe(browserSync.stream());
});


/* ======================== */
/*           SASS           */
/* ======================== */
gulp.task('styles', function () {
    return gulp.src('app/styles/*.scss')
        .pipe(plumber({ errorHandler: plumberError }))
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'expanded' }))
        .pipe(autoprefixer({
            browsers: [
                'last 1 major version',
                '>= 1%',
                'Chrome >= 45',
                'Firefox >= 38',
                'Edge >= 12',
                'Explorer >= 10',
                'iOS >= 9',
                'Safari >= 9',
                'Android >= 4.4',
                'Opera >= 3'
            ]
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/css'))
        .pipe(browserSync.stream());
});
/* ======================== */
/*            JS            */
/* ======================== */
gulp.task('js:modules', function() {
    return gulp.src(['app/modules/**/*.js'])
        .pipe(plumber({ errorHandler: plumberError }))
        .pipe(include({
          hardFail: true,
          includePaths: [
            __dirname + "/",
            __dirname + "/node_modules",
            __dirname + "/app/modules/"
          ]
        }))
        .pipe(concat('modules.js', { newLine: '\n\n' }))
        .pipe(gulp.dest('tmp/js'));
});

gulp.task('js:compile', ['js:modules'], function() {
    return gulp.src("app/scripts/app.js")
        .pipe(gulp.dest("tmp/js"));
});

gulp.task('js:build', ['js:compile'], function() {
    return gulp.src("tmp/js/app.js")
        .pipe(include({
          extensions: "js",
          hardFail: true,
          includePaths: [
            __dirname + "/tmp/js"
          ]
        }))
        .pipe(rmEL())
        .pipe(gulp.dest("build/js"))
        .pipe(browserSync.stream());
});

/* ======================== */
/*          IMAGES          */
/* ======================== */
gulp.task('images', function() {
  return gulp.src('app/resources/images/**/*')
    .pipe(plumber({ errorHandler: plumberError }))
    .pipe(cache(imagemin({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })))
    .pipe(gulp.dest('build/images'))
    .pipe(browserSync.stream());
});

/* ======================== */
/*          SPRITE          */
/* ======================== */
gulp.task('sprite', function () {
    var spriteData = gulp.src('app/resources/icons/*.*')
        .pipe(spritesmith({
            retinaSrcFilter: 'app/resources/icons/*@2x.png',
            imgName: '../images/sprite.png',
            retinaImgName: '../images/sprite@2x.png',
            cssName: 'sprite.scss',
            algorithm: 'binary-tree',
            padding: 5
        }));
    spriteData.img.pipe(gulp.dest('./build/images'));
    spriteData.css.pipe(gulp.dest('./tmp'));
    browserSync.reload();
});

/* ======================== */
/*           LIBS           */
/* ======================== */
gulp.task('js:dependencies', function() {
    return gulp.src(['app/libs/'+JQUERY_VERSION, 'app/libs/modernizr.js'])
        .pipe(gulp.dest("build/js"));
});

gulp.task('js:libs', function () {
    return gulp.src(["app/libs/**/*.js", '!app/libs/'+JQUERY_VERSION, '!app/libs/modernizr.js'])
        .pipe(plumber({ errorHandler: plumberError }))
        .pipe(concat('libs.js', { newLine: '\n\n' }))
        .pipe(gulp.dest("build/js"))
        .pipe(browserSync.stream());
});

gulp.task('css:libs', function () {
    return gulp.src("app/libs/**/*.css")
        .pipe(plumber({ errorHandler: plumberError }))
        .pipe(sourcemaps.init())
        .pipe(concat('libs.css', { newLine: '\n\n' }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/css'))
        .pipe(browserSync.stream());
});

/* ======================== */
/*          FONTS           */
/* ======================== */
gulp.task('fonts', function () {
    return gulp.src('app/resources/fonts/**/*.{eot,ttf,svg,woff,woff2}')
        .pipe(gulp.dest('build/fonts'))
        .pipe(browserSync.stream());
});

/////////////////////////////////////////
//               WATCH                 //
/////////////////////////////////////////

gulp.task('watch', function() {
    global.watch = true;

    gulp.watch('app/**/*.pug', ['templates']).on('all', function (event, filepath) { global.emittyChangedFile = filepath; });
    gulp.watch('app/**/*.scss', ['styles']);
    gulp.watch('app/resources/images/*.{png, jpg}', ['images']);
    gulp.watch('app/resources/images/**/*.{png, jpg}', ['images']);
    gulp.watch('app/resources/icons/*.png', ['sprite']);
    gulp.watch('app/resources/fonts/**/*.{eot,ttf,svg,woff,woff2}', ['fonts']);
    gulp.watch('app/modules/**/*.js', ['js:modules','js:compile','js:build']);
    gulp.watch('app/libs/**/*.js', ['js:libs']);
    gulp.watch('app/libs/**/*.css', ['css:libs']);
});

/////////////////////////////////////////
//               BUILD                 //
/////////////////////////////////////////



/////////////////////////////////////////
//             DEVELOPMENT             //
/////////////////////////////////////////
gulp.task('dev',
  [
    'fonts',
    'templates',
    'sprite',
    'styles',
    'images',
    'js:modules',
    'js:compile',
    'js:build',
    'js:dependencies',
    'js:libs',
    'css:libs',
    'serve',
    'watch'
  ]
);