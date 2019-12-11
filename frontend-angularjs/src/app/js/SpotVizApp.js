var spotVizApp = angular.module('SpotVizApp', [ 'ui.bootstrap', "ui.router", "ngAnimate",
		"ui.date", "ngSanitize", "calHeatmap", "ui-leaflet",
		"SpotVizControllers", "SpotDataControllers",
		"angulartics", "angulartics.google.analytics", 'ngDialog' ]);

	spotVizApp.config(function($stateProvider, $urlRouterProvider) {
    
    $stateProvider    
        // show home page
        .state('home', {
            url: '/home',
            templateUrl: 'home.html'
        })
        
        //show visualization page
        .state('visualize', {
            url: '/visualize',
            templateUrl: 'mapviz/mapviz.html',
            controller: 'SpotVizController'
        })

        //visualization callsign selection
        .state('visualize.selectCallsign', {
            url: '/callsign',
            templateUrl: 'mapviz/selectCallsign.html'
        })

        //visualization date range selection
        .state('visualize.selectDateRange', {
            url: '/dateRange',
            templateUrl: 'mapviz/selectDateRange.html'
        })

        //visualization playback
        .state('visualize.playback', {
            url: '/playback',
            templateUrl: 'mapviz/playback.html'
        })

        //upload page
        .state('upload', {
            url: '/upload',
            templateUrl: 'howToUpload.html'
        })

        //show searchTopUploaders
        .state('searchTopUploaders', {
            url: '/searchTopUploaders',
            templateUrl: 'searchTopUploaders.html'
        })

        //show searchUploadsByCallsign
        .state('searchUploadsByCallsign', {
            url: '/searchUploadsByCallsign',
            templateUrl: 'searchUploadsByCallsign.html'
        })

        
        //show FAQ
        .state('faq', {
            url: '/faq',
            templateUrl: 'faq.html'
        })
        
        //show 'how to log a bug' page
        .state('bug', {
            url: '/bug',
            templateUrl: 'bug.html'
        })
        
        //show about page
        .state('about', {
            url: '/about',
            templateUrl: 'about.html'
        })
        
    // catch all route
    // send users to the home page 
    $urlRouterProvider.otherwise('/home');
});