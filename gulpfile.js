const gulp = require('gulp');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const gzip = require('gulp-gzip');

function handleError(err) {
    console.error(err.toString());
    this.emit('end');
}

gulp.task('compress-css', function () {
    return gulp.src('apps/static/assets/dist/css/**/*.css')
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sourcemaps.init())
        .pipe(cssnano())
        .pipe(sourcemaps.write('.'))
        .pipe(gzip())
        .pipe(gulp.dest('apps/static/assets/css'));
});

gulp.task('compress-js', function () {
    return gulp.src([
        'apps/static/assets/dist/js/**/*.js',
        '!apps/static/assets/dist/js/index.js',
        '!apps/static/assets/dist/js/map_and_layers_retriever.js',
        '!apps/static/assets/dist/js/dropdown_filter.js',
        '!apps/static/assets/dist/js/dropdown.js'
    ])
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gzip())
        .pipe(gulp.dest('apps/static/assets/js'));
});

gulp.task('watch', function () {
    gulp.watch('apps/static/assets/dist/css/**/*.css', gulp.series('compress-css'));
    gulp.watch('apps/static/assets/dist/js/**/*.js', gulp.series('compress-js'));
});

function shouldWatch() {
    return process.argv.includes('--watch');
};

gulp.task('default', gulp.series('compress-css', 'compress-js', function (done) {
    if (shouldWatch()) {
        gulp.task('watch')();
    }
    done();
}));