var spotVizApp = angular.module('SpotVizApp', [ "ngRoute", "ngAnimate",
		"ui.date", "ngMap", "ui.bootstrap", "SpotVizControllers" ]);

spotVizApp.config([ '$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl : 'home.html',
		controller : 'HomeController'
	}).when('/mapviz', {
		templateUrl : 'mapviz/mapviz.html',
		controller : 'SpotVizController'
	}).when('/upload', {
		templateUrl : 'howToUpload.html'
	}).when('/faq', {
		templateUrl : 'faq.html'
	}).when('/bug', {
		templateUrl : 'bug.html'
	}).when('/about', {
		templateUrl : 'about.html',
		controller : 'AboutController'
	}).otherwise({
		redirectTo : '/'
	});
} ]);
