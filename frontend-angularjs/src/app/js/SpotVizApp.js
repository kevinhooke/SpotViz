//reference jquery libs first before angular to avoid issues with jqlite nosel errors etc
require('jquery');
require('jquery-ui');
require('jquery-ui/ui/widgets/datepicker');

import '../css/callsignviz.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import 'ng-dialog/css/ngDialog.min.css';
import 'ng-dialog/css/ngDialog-theme-default.min.css';
import 'jquery-ui/themes/base/all.css';
import '../../../bower_components/cal-heatmap/cal-heatmap.css';

//require('moment');
require('angular-moment');
require('angular');
import angular from 'angular';

require('bootstrap'); //bootstrap.js
require('bootstrap-nav-wizard');

require('angular-animate');
require('angular-messages');
require('angular-sanitize');
require('angular-ui-date');
require('angular-ui-router');

require('angular-ui-bootstrap'); // for <timepicker>
//import timepicker from 'angular-ui-bootstrap/src/timepicker';
//require('ui-bootstrap-tpls');
//require('angular-ui-bootstrap-tpls');
require('angular-ui-bootstrap/dist/ui-bootstrap-tpls');

require('angular-simple-logger');
require('leaflet');
import 'leaflet/dist/leaflet.css';
require('ui-leaflet');
require('ng-dialog');

require('angulartics');

/*
 * cal-heatamp defines a global var which is not found when referenced by code in modules that use
 * it, and needs to be shimmed by webpack using ProvidePlugin in webpack.config.js
 */
//require('d3');
//require('cal-heatmap');
//require('angular-cal-heatmap');
import d3 from 'd3';
//import d3 from '../../../bower_components/d3/d3.js'
//require('../../../bower_components/d3/d3.js');
import CalHeatMap from 'cal-heatmap';
//require('../../../bower_components/cal-heatmap/cal-heatmap.js');
//import * as CalHeatMap from '../../../bower_components/cal-heatmap/cal-heatmap.js';
//import * as CalHeatMap from 'cal-heatmap';
//require('../../../bower_components/cal-heatmap/cal-heatmap.js');

//PREVIOUS WORKING library
//import 'angular-cal-heatmap';
//test modified version
import './calHeatmapKH.js';

//require('../../../bower_components/angular-cal-heatmap-directive/dist/1.3.0/calHeatmap.min.js');
//import '../../../bower_components/angular-cal-heatmap-directive/dist/1.3.0/calHeatmap.min.js';

require('./MapVizControllers');
require('./MapVizServices');
require('./SpotDataControllers');

//imports for html templates
//import historyPlaybackControlsTemplate from '../mapviz/historyPlaybackControls.html';
//import visualizationPlaybackTemplate from '../mapviz/visualizationPlayback.html';
//require('ngtemplate-loader!html-loader!../mapviz/historyPlaybackControls.html');
//require('../mapviz/visualizationPlayback.html');

//require('ng-cache-loader?prefix=/!../mapviz/historyPlaybackControls.html');
//require('ng-cache-loader?prefix=/!../mapviz/visualizationPlayback.html');

console.log("run mode: " + process.env.NODE_ENV );
console.log("api_url: " + process.env.API_URL );

//20200105 previous working
// var spotVizApp = angular.module('SpotVizApp', [ 'angularMoment', "ui.router", "ngAnimate",
// 		"ui.date", "ngSanitize", "calHeatmap", "ui-leaflet",
// 		"SpotVizControllers", "SpotDataControllers", 'ngDialog' ]);
//updated, removed
var spotVizApp = angular.module('SpotVizApp', [ 'angularMoment', "ui.router", "ngAnimate",
    "ui.date", "ngSanitize", "calHeatmapKH", "ui-leaflet",
    "SpotVizControllers", "SpotDataControllers", 'ngDialog' ]);

// //create components
// spotVizApp.component('historyPlaybackControls', {
//     template : historyPlaybackControlsTemplate,
//     controller: 'SpotVizControllers'
// });
// spotVizApp.component('visualizationPlayback', {
//     template : visualizationPlaybackTemplate,
//     controller: 'SpotVizControllers'
// });

spotVizApp.config([ '$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    
    $stateProvider    
        // show home page
        .state('home', {
            url: '/home',
            template: require('../home.html')
        })
        
        //show visualization page
        .state('visualize', {
            url: '/visualize',
            template: require('../mapviz/mapviz.html'),
            controller: 'SpotVizController'
        })

        //visualization callsign selection
        .state('visualize.selectCallsign', {
            url: '/callsign',
            template: require('../mapviz/selectCallsign.html')
        })

        //visualization date range selection
        .state('visualize.selectDateRange', {
            url: '/dateRange',
            template: require('../mapviz/selectDateRange.html')
        })

        //visualization playback
        .state('visualize.playback', {
            url: '/playback',
            template: require('../mapviz/playback.html')
        })

        //upload page
        .state('upload', {
            url: '/upload',
            template: require('../howToUpload.html')
        })

        //show searchTopUploaders
        .state('searchTopUploaders', {
            url: '/searchTopUploaders',
            template: require('../searchTopUploaders.html')
        })

        //show searchUploadsByCallsign
        .state('searchUploadsByCallsign', {
            url: '/searchUploadsByCallsign',
            template: require('../searchUploadsByCallsign.html')
        })

        
        //show FAQ
        .state('faq', {
            url: '/faq',
            template: require('../faq.html')
        })
        
        //show 'how to log a bug' page
        .state('bug', {
            url: '/bug',
            template: require('../bug.html')
        })
        
        //show about page
        .state('about', {
            url: '/about',
            template: require('../about.html')
        })
        
    // catch all route
    // send users to the home page 
    $urlRouterProvider.otherwise('/home');
}]);