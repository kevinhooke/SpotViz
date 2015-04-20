
module.exports = function (config) {
    config.set({
        basePath: '.',
        files: [
            'webapp/bower_components/angular/angular.js',
            'webapp/bower_components/angular-mocks/angular-mocks.js',
            'webapp/bower_components/moment/moment.js',
            'webapp/js/SpotVizApp.js',
            'webapp/js/MapVizControllers.js',
            'webapp/js/DateTimerController.js',
            'webapp/js/MapVizServices.js',
            'specs/*.js'
        ],
        exclude: [
        ],
        autoWatch: true,
        frameworks: [
            'jasmine'
        ],
        browsers: [
            'Chrome'
        ],
        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine'
        ]
    });
};
