var spotVizApp = angular.module('SpotVizApp', [ "ui.router", "ngAnimate",
		"ui.date", "ngMap", "ui.bootstrap", "calHeatmap", "SpotVizControllers", 
		"angulartics", "angulartics.google.analytics" ]);

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

        //visualization calsign selection
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
        
//        // nested state examaples 
//        // each of these sections will have their own view
//        // url will be nested (/form/profile)
//        .state('form.profile', {
//            url: '/profile',
//            templateUrl: 'form-profile.html'
//        })
//        
//        // url will be /form/interests
//        .state('form.interests', {
//            url: '/interests',
//            templateUrl: 'form-interests.html'
//        })
//        
//        // url will be /form/payment
//        .state('form.payment', {
//            url: '/payment',
//            templateUrl: 'form-payment.html'
//        });
        
    // catch all route
    // send users to the home page 
    $urlRouterProvider.otherwise('/home');
});

	
	
//prior ngRoute approach
//
//var spotVizApp = angular.module('SpotVizApp', [ "ngRoute", "ngAnimate",
//		"ui.date", "ngMap", "ui.bootstrap", "SpotVizControllers" ]);
//
//spotVizApp.config([ '$routeProvider', function($routeProvider) {
//	$routeProvider.when('/', {
//		templateUrl : 'home.html',
//		controller : 'HomeController'
//	}).when('/mapviz', {
//		templateUrl : 'mapviz/mapviz.html',
//		controller : 'SpotVizController'
//	}).when('/upload', {
//		templateUrl : 'howToUpload.html'
//	}).when('/faq', {
//		templateUrl : 'faq.html'
//	}).when('/bug', {
//		templateUrl : 'bug.html'
//	}).when('/about', {
//		templateUrl : 'about.html',
//		controller : 'AboutController'
//	}).otherwise({
//		redirectTo : '/'
//	});
//} ]);
