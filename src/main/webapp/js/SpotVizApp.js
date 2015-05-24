var spotVizApp = angular.module('SpotVizApp', 
	[
	 	"ngRoute",
	 	"ui.date",
	 	"ngMap",
	 	"ui.bootstrap",
	 	"SpotVizControllers"	]);

//"uiGmapgoogle-maps"

spotVizApp.config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.
      when('/', {
          templateUrl: 'home.html',
          controller: 'HomeController'
        }).
        when('/mapviz', {
          templateUrl: 'mapviz/mapviz.html',
          controller: 'SpotVizController'
        }).
        when('/about', {
          templateUrl: 'about.html',
          controller: 'AboutController'
        }).
        otherwise({
          redirectTo: '/'
        });
    }]);
