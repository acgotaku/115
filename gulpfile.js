const gulp = require('gulp')

const rollupEach = require('gulp-rollup-each')
const rollupBabel = require('rollup-plugin-babel')
const rollupResolve = require('rollup-plugin-node-resolve')
const rollupCommon = require('rollup-plugin-commonjs')

const del = require('del')
const zip = require('gulp-zip')
const gulpIf = require('gulp-if')

const eslint = require('gulp-eslint')
const stylelint = require('gulp-stylelint')

const postcss = require('gulp-postcss')
const sass = require('gulp-sass')
const autoprefixer = require('autoprefixer')
const concat = require('gulp-concat')
const cleanCSS = require('gulp-clean-css')

const imagemin = require('gulp-imagemin')
const mozjpeg = require('imagemin-mozjpeg')
const pngquant = require('imagemin-pngquant')

const plumber = require('gulp-plumber')

const uglify = require('gulp-uglify')

const paths = {
  scripts: {
    src: 'src/js/**/*.js',
    entry: 'src/js/*.js',
    dest: 'dist/js/'
  },
  styles: {
    src: 'src/css/**/*.scss',
    dest: 'dist/css/'
  },
  images: {
    src: 'src/img/**/*',
    dest: 'dist/img/'
  },
  copys: {
    src: ['_locales/**/*', 'background.js', 'manifest.json'],
    dest: 'dist/'
  },
  compress: {
    src: 'dist/**/*',
    dest: 'dist/'
  }
}

const config = {
  plumberConfig: {
    errorHandler: function (err) {
      console.log(err.toString())
      this.emit('end')
    }
  },
  env: {
    dev: process.env.NODE_ENV === 'development',
    prod: process.env.NODE_ENV === 'production'
  }
}

function lintJS () {
  return gulp.src(paths.scripts.src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
}

function lintCSS () {
  return gulp.src(paths.styles.src)
    .pipe(stylelint({
      reporters: [
        { formatter: 'string', console: true }
      ]
    }))
}

function scripts () {
  return gulp.src(paths.scripts.entry)
    .pipe(plumber(config.plumberConfig))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(rollupEach({
      isCache: true,
      plugins: [
        rollupBabel({
          presets: ['@babel/preset-env']
        }),
        rollupResolve({
          browser: true
        }),
        rollupCommon()
      ]
    },
    {
      format: 'iife'
    }
    ))
    .pipe(gulpIf(config.env.prod, uglify()))
    .pipe(gulp.dest(paths.scripts.dest), { sourcemaps: config.env.dev })
}

function styles () {
  return gulp.src(paths.styles.src)
    .pipe(plumber(config.plumberConfig))
    .pipe(stylelint({
      reporters: [
        { formatter: 'string', console: true }
      ]
    }))
    .pipe(sass({
      outputStyle: 'nested',
      precision: 3,
      includePaths: ['.']
    }))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(concat('style.css'))
    .pipe(gulpIf(config.env.prod, cleanCSS()))
    .pipe(gulp.dest(paths.styles.dest), { sourcemaps: config.env.dev })
}

function images () {
  return gulp.src(paths.images.src)
    .pipe(plumber(config.plumberConfig))
    .pipe(imagemin([
      pngquant(),
      mozjpeg(),
      imagemin.svgo()], {
      verbose: true
    }))
    .pipe(gulp.dest(paths.images.dest))
}

function copys () {
  return gulp.src(paths.copys.src, { base: '.' })
    .pipe(gulp.dest(paths.copys.dest))
}

function compress () {
  return gulp.src(paths.compress.src)
    .pipe(zip('chrome.zip'))
    .pipe(gulp.dest(paths.compress.dest))
}

function clean () {
  return del(['dist'])
}

function watch () {
  gulp.watch(paths.copys.src, copys)
  gulp.watch(paths.scripts.src, scripts)
  gulp.watch(paths.styles.src, styles)
}

const build = gulp.parallel(scripts, styles, images, copys)
const serve = gulp.series(clean, build, watch)
const publish = gulp.series(clean, build, compress)

exports.build = build
exports.serve = serve
exports.publish = publish
exports.lintJS = lintJS
exports.lintCSS = lintCSS
exports.clean = clean
