var spotVizApp = angular.module('SpotVizApp', 
	[
	 	"ngRoute",
	 	"ui.date",
	 	"uiGmapgoogle-maps",
	 	"SpotVizControllers",
	 	"DateControllers"
	]);


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

spotVizApp.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //use key for prod server
    	//key: 'AIzaSyC3qPMWNCibTkiKlNpCeU3zO0pRjU-iClU',
        v: '3.17',
        libraries: 'weather,geometry,visualization'
    });
})
