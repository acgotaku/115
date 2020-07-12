import gulp from 'gulp'

import rollupEach from 'gulp-rollup-each'
import rollupCommon from '@rollup/plugin-commonjs'
import rollupResolve from '@rollup/plugin-node-resolve'
import rollupBuble from '@rollup/plugin-buble'

import del from 'del'
import gulpIf from 'gulp-if'

import eslint from 'gulp-eslint'
import stylelint from 'gulp-stylelint'

import postcss from 'gulp-postcss'
import sass from 'gulp-sass'
import autoprefixer from 'autoprefixer'
import concat from 'gulp-concat'
import cleanCSS from 'gulp-clean-css'

import imagemin from 'gulp-imagemin'
import mozjpeg from 'imagemin-mozjpeg'
import pngquant from 'imagemin-pngquant'

import plumber from 'gulp-plumber'

import terser from 'gulp-terser'

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
  return gulp.src(paths.scripts.entry, { sourcemaps: config.env.dev })
    .pipe(plumber(config.plumberConfig))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(rollupEach({
      isCache: true,
      plugins: [
        rollupCommon(),
        rollupResolve({
          browser: true
        }),
        rollupBuble({
          transforms: { forOf: false, asyncAwait: false }
        })
      ]
    },
    {
      format: 'iife'
    }
    ))
    .pipe(gulpIf(config.env.prod, terser()))
    .pipe(gulp.dest(paths.scripts.dest, { sourcemaps: config.env.dev }))
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
const publish = gulp.series(clean, build)

exports.build = build
exports.serve = serve
exports.publish = publish
exports.lintJS = lintJS
exports.lintCSS = lintCSS
exports.clean = clean
