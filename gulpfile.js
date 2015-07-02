
var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var watch = require('gulp-watch');

gulp.task('default', ['watch-test'], function() {
	
});

gulp.task('watch-test', function() {
	return gulp.watch(['src/**/*.js', 'spec/**/*.js'])
		.on('change', function(file) {
			gulp.src('spec/**/*.js')
				.pipe(jasmine());
		});
});
