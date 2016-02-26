import gulp from 'gulp';
import rename from 'gulp-rename';
import del from 'del';
import sass from 'gulp-sass';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import es from 'event-stream';
import concat from 'gulp-concat';
import glob from 'glob';

const paths = {
  sass: 'src/public/sass/*.scss',
  js: 'src/ui/client/**.js',
  libs: [
    './node_modules/react/dist/react.js',
    './node_modules/react-dom/dist/react-dom.js',
  ],
  jsWatch: 'src/ui/*.jsx',
  images: 'src/public/images/*.*',
  dist: 'dist/',
};

gulp.task('default', ['build', 'watch']);
gulp.task('build', ['build:sass', 'build:images', 'build:browserify', 'build:libs']);

gulp.task('build:browserify', (done) => {
  glob(paths.js, (err, reactJsFiles) => {
    if (err) { return done(err); }
    const reactFiles = reactJsFiles.map((reactFile) =>
      browserify({ entries: reactFile, extensions: ['.js', '.jsx'], debug: true })
        .transform(babelify.configure({
          presets: ['es2015', 'react'],
          plugins: ['syntax-class-properties', 'transform-class-properties'],
        }))
        .bundle()
        .pipe(source(reactFile))
        .pipe(rename({ dirname: '' }))
        .pipe(gulp.dest(`${paths.dist}/js/`)));
    es.merge(reactFiles).on('end', done);
  });
});

gulp.task('build:libs', () => {
  gulp.src(paths.libs)
  .pipe(concat('libs.js'))
  .pipe(gulp.dest(`${paths.dist}/js/`));
});

gulp.task('build:sass', () => {
  return gulp.src(paths.sass)
    .pipe(
      sass({
        errLogToConsole: true,
      })
    )
  .pipe(gulp.dest(`${paths.dist}css`));
});

gulp.task('clean', () => del(['dest']));

gulp.task('build:images', () => gulp.src([paths.images]).pipe(gulp.dest(`${paths.dist}images`)));

gulp.task('watch', () => gulp.watch([paths.sass, paths.jsWatch], ['build']));
