//import historyPlaybackControlsTemplate from "../mapviz/historyPlaybackControls.html";
//import visualizationPlaybackTemplate from "../mapviz/visualizationPlayback.html";

var spotVizControllers = angular.module('SpotVizControllers', ['ngAnimate', 'ngSanitize',
    'angularMoment']);

spotVizControllers.filter('spotIntervalFilter', ['moment', function (moment) {

    return function (data, interval, intervalBoundaries) {
        var filteredData = [];
        var boundary = intervalBoundaries[interval];
        //TODO if have index positions from a prior run, use those and do a slice
        //otherwise iterate through to find posts within the interval
        for (var i = 0; i < data.length; i++) {
            currentSpotDate = data[i].spotReceivedTimestamp.$date;
            //if current date is after the last date for this interval, then skip the rest
            if (moment.utc(currentSpotDate).isAfter(boundary.intervalEndDate)) {
                break;
            }
            else {
                if (moment.utc(currentSpotDate).isAfter(boundary.intervalStartDate)
                        && moment.utc(currentSpotDate).isBefore(boundary.intervalEndDate)) {
                    filteredData.push(data[i]);
                }
            }
        }
        //filteredData = data.slice(boundary.intervalStartDate, boundary.intervalEndDate);
        return filteredData;
    }

}]);

spotVizControllers.controller('uiLeafletController', function () {
	//
});

spotVizControllers.controller('SpotVizController', ['$scope', '$http', '$filter', '$interval',
    '$state', 'ngDialog', 'moment',
    function ($scope, $http, $filter, $interval, $state, ngDialog, moment) {

        //set focus on callsign field
        angular.element('#callsign').trigger('focus');
        //model for search views
        $scope.search = {};

        //show the welcome instructions
        $scope.search.visualizeWelcome = true;

        //toggle for showing map after form values submitted
        $scope.search.showMap = false;

        //spot data available count
        $scope.search.numberOfSpots = null;

        //selected start and end dates and times, combined
        $scope.search.selectedStartDateTime = null;
        $scope.search.selectedEndDateTime = null;

        

        //default from and to date options for date pickers
        $scope.search.fromDateOptions = null;
        $scope.search.toDateOptions = null;

        //show data density displays
        $scope.search.showDataDensity = false;
        $scope.search.showDataDensityPerHour = false;

        //TODO what is this used for?
        $scope.search.date = moment();
        
        //heatmap config
        $scope.search.heatmap = {};
        $scope.search.heatmap.config = {};
        $scope.search.heatmap.perhourConfig = {};
        
        //playback controls
        var runningCounter = null;
        //initial empty array for map marker positions
        $scope.playbackData = {};
        $scope.playbackData.positions = [];

        $scope.playbackControls = {};
        $scope.search.minuteStep = 5; //TODO: is this used? replaced my timeInterval
        $scope.playbackControls.timeInterval = 5; //how many minutes the date advances on each iteration
        $scope.playbackControls.debugMsg = null;
        $scope.playbackControls.noSpotsInIntervalMsg = "";
        $scope.playbackControls.iterations = 0; //number of times the interval runs, 0 = continuous
        $scope.playbackControls.updateRate = 2; //number of seconds betweeb updates
        $scope.playbackControls.state = "Stopped";

        //progress bar
        $scope.playbackControls.currentValue = 1;
        $scope.playbackControls.currentInterval = 0;

        //$scope.uileafletaccessor.invalidateSize();

        /*
         * Creates array of markers from data for the currently playing interval.
         */
        function createMarkersFromData(data, interval, intervalBoundaries) {

            var currentIntervalSpots = $filter('spotIntervalFilter')(data, interval, intervalBoundaries);
            //empty the array of positions
            $scope.playbackData.positions = [];

            if(currentIntervalSpots.length == 0){
            	$scope.playbackControls.noSpotsInIntervalMsg = "No spots in this interval!";
            }
            else{
                for (var i = 0; i < currentIntervalSpots.length; i++) {
                    
                	if(currentIntervalSpots[i].spotDetail.latitude != undefined){
                	
	                	//google maps format
	//                	$scope.playbackData.positions.push({
	//                        lat: currentIntervalSpots[i].spotDetail.latitude,
	//                        lng: currentIntervalSpots[i].spotDetail.longitude});
	                	
	                	//leaflet format
	                	$scope.playbackData.positions.push( {
            				lat: parseFloat(currentIntervalSpots[i].spotDetail.latitude),
            				lng: parseFloat(currentIntervalSpots[i].spotDetail.longitude)
            			});
                	}
                }
                $scope.playbackControls.noSpotsInIntervalMsg = "Spots in this interval: " + $scope.playbackData.positions.length
            }
        }


        /*
         * Retrieves a summary of spots for the currently entered callsign. 
         */
        $scope.retrieveSpotSummaryForCallsign = function () {
            if (!angular.isUndefined($scope.search.callsign) && $scope.search.callsign != null) {
                var url = process.env.API_URL + "/spotviz/spotdata/spots/" + $scope.search.callsign;
                console.log("$http GET request: " + url);
                $http({
                  method: 'GET',
                  url: url
                }).then(function (response){
                	var data = response.data;
                    console.log('data: ' + data)
                    if (Object.keys(data) == 0) {
                        $scope.msg = "Sorry, there's no spot data currently uploaded for callsign ["
                                + $scope.callsign + "]. Click the link 'How to upload your spots' (TODO) for" +
                                "instructions on how to upload your received spot data for visualzation.";

                        $scope.search.popoverTextWhenDataAvailable = "";
                        $scope.search.numberOfSpots = 0;
                        $scope.search.spots = "";
                        $scope.playbackData.markers = [];
                    } else {
                        //TODO: setting default from and to dates are not in expected format, but selecting from
                        //picker is in correct format
                        $scope.search.msg = '';
                        $scope.search.numberOfSpots = data.totalSpots;
                        
                        var firstSpotDate = data.firstSpot.$date;
                        $scope.search.dateFirstSpot = data.firstSpot.$date;
                        $scope.fromDate = moment(firstSpotDate).toDate();
                        $scope.search.fromDate = $scope.fromDate
                        $scope.search.fromTime = $scope.fromDate;
                        
                        var lastSpotDate = moment(data.lastSpot.$date).add(1, 'days').toDate();
                        $scope.search.toDate = lastSpotDate;
                        $scope.search.toTime = lastSpotDate;
                        $scope.search.fromDateOptions = {
                            minDate: new Date(data.firstSpot.$date),
                            maxDate: lastSpotDate
                        };
                        $scope.search.dateLastSpot = data.lastSpot.$date;

                        $scope.search.toDateOptions = {
                            minDate: new Date(data.firstSpot.$date),
                            maxDate: lastSpotDate
                        };

                        $scope.search.formattedFromDate = moment.utc($scope.search.dateFirstSpot).format("YYYY/MM/DD HH:mm:ss");
                        $scope.search.formattedEndDate = moment.utc($scope.search.toDate).format("YYYY/MM/DD HH:mm:ss");

                        $scope.search.popoverTextWhenDataAvailable = "For callsign [" + $scope.search.callsign
                                + "] there is data available from "
                                + $scope.search.formattedFromDate + " UTC "
                                + "and "
                                + $scope.search.formattedEndDate + " UTC.";
                    }

                });
            }
            else {
                $scope.search.popoverTextWhenDataAvailable = "";
            }
        }

        $scope.hideDialogsIfCallsignEmpty = function(){
            if($scope.search.callsign === ''){
                $scope.search.numberOfSpots = null;
            }
        }

        /*
         * Resets the page 1 callsign search.
         * @returns {undefined}
         */
        $scope.resetCallsignSearch = function(){
            $scope.search.numberOfSpots = null;
        }

        /*
         * Navigates to page 2: Date range selection. 
         * @returns {undefined}
         */
        $scope.navigateToDateRangeSelection = function(){
            
            $state.go('visualize.selectDateRange');
            
        }

        /*
         * Navigates to page 3: Playback. 
         * @returns {undefined}
         */
        $scope.navigateToPlayback = function(){
            
            $state.go('visualize.playback');
            
        }

        /*
         * Retrieves spots for given callsign and date range, with heatmap data.
         */
        $scope.retrieve = function () {
        	
        	//set heatmap display back to false to force to redraw if there is data for range
        	$scope.search.showDataDensity = false;

        	//when using timepicker
            //var fromTimeOnly = moment($scope.search.fromTime).format("HH:mm:ss");
            //var toTimeOnly = moment($scope.search.toTime).format("HH:mm:ss");
            var fromTimeOnly = $scope.search.fromTime;
            var toTimeOnly = $scope.search.toTime;
            var formattedFromDate = moment($scope.search.fromDate).format("YYYY-MM-DD");
            var formattedToDate = moment($scope.search.toDate).format("YYYY-MM-DD");
            $scope.search.selectedStartDateTime = formattedFromDate + "T" + fromTimeOnly + "Z";
            $scope.search.selectedEndDateTime = formattedToDate + "T" + toTimeOnly + "Z";


            var url = process.env.API_URL + "/spotviz/spotdata/spots/" + $scope.search.callsign
                    + "?fromdate=" + $scope.search.selectedStartDateTime
                    + "&todate=" + $scope.search.selectedEndDateTime;


            $scope.search.debugMsg = "url is:" + url;
		    $http({
		      method: 'GET',
		      url: url
		    }).then(function (response){
		    	var data = response.data;
                if (data == {}) {
                    $scope.search.msg = "No data for callsign: " + $scope.callsign;
                    $scope.search.spots = "";
                    $scope.playbackData.markers = [];
                    $scope.search.showDataDensity = false;
                } else {
                    $scope.search.msg = "";
                    $scope.search.selectedRangeMsg = "Selected start date : " + formattedFromDate + fromTimeOnly + " UTC "
                            + "end date: " + formattedToDate + " " + toTimeOnly + " UTC "
                            + "Spots for selected date range: " + data.length;
                    $scope.search.spots = data;
                }
            }, function (error){
            	console.log(error);
            	//TODO: msg is not currently displayed on page?
                $scope.msg = "Failed to retrieve spot summary data at this time. Try later?";
            });
            
          //build heatmap options
            url = process.env.API_URL + "/spotviz/spotdata/heatmapCounts/" + $scope.search.callsign;
            //TODO: add date range
            //+ "?fromdate=" + $scope.search.selectedStartDateTime
            //+ "&todate=" + $scope.search.selectedEndDateTime;
            
            //retrieve and parse heatmap counts 
            //$http.get(url).success(function (heatmapData) {
            $http({
                method: 'GET',
                url: url
              }).then(function (response){
            	var heatmapData = response.data;
            	
                if (heatmapData == {}) {
                	$scope.search.showDataDensity = false;
                }
                else{
                    $scope.search.heatmap = {};
                    $scope.search.heatmap.config = {
                        domain: "month",
                        //legend: [10,100,2000,4000,6000], //bug: more than 4 range values doesn't work
                        legend : [1000, 2000, 4000, 6000], //angular-cal-heatmap default: [2,4,6,8],
                        range: 6, //angular-cal-heatmap default: 3, when domain=month, displays 6 months
                        subDomainTextFormat: "%d",
                        start: $scope.search.fromDate
                        }
                };
                    
                //reformat data to expected format for Cal-HeatMap
                //TODO: can this processing be moved to the endpoint?
                var parser = function(data) {
                	var parsedData = {};
                	parsedData.display = {};
                	parsedData.lookup = {};
                	for (var i in data.heatmapCounts) {
                		var ts = data.heatmapCounts[i]._id; //test removing this: / 1000;                 		
                		ts = ts / 1000; // change back to seconds for cal-heatmap expected format
                		parsedData.display[ts] = data.heatmapCounts[i].count;
                		parsedData.lookup[ts] = { 
                				firstSpot:  data.heatmapCounts[i].firstSpot,
                				lastSpot: data.heatmapCounts[i].lastSpot,
                				count: data.heatmapCounts[i].count
                		};
                	}
                	return parsedData;
                };
                var parsedHeatmapData = parser(heatmapData);
                $scope.search.heatmap.config.data = parsedHeatmapData.display;
                $scope.search.heatmap.rawdata = parsedHeatmapData.lookup;
                
                //afterLoadData not supported by directive?
                //$scope.search.heatmap.config.afterLoadData = parser;
                
                //toggle flag for ng-if display
                $scope.search.showDataDensity = true;

        	}, function (error){
            	console.log(error);
            	//TODO: msg is not currently displayed on page?
                $scope.msg = "Failed to retrieve heatmap data at this time. Try later?";
            });
            
        }

        $scope.showStatsForDate = function(event) {
        	
        	//workaound for cal-heatmap tz issue: https://github.com/wa0x6e/cal-heatmap/issues/126
        	//cal-heatmap problem: clicked 1/26/2018 has ts : 1516953600000 : Fri Jan 26 2018 00:00:00 GMT-0800
        	// id in array of data                   has ts : 1517011200000 : Fri Jan 26 2018 16:00:00 GMT-080
        	
        	//               clicked 3/17/2018       has ts : 1521270000000 : Sat Mar 17 2018 00:00:00 GMT-0700
        	// id in array                                  : 1521331200000 : Sat Mar 17 2018 17:00:00 GMT-0700
        	// after calc                                   : 1521298800000 : Sat Mar 17 2018 07:00:00 GMT-0700
        	
        	//workaround: new Date( 1521270000000 + (( new Date(1521270000000).getTimezoneOffset() + (1*60)) * 60 * 1000)).getTime()
        	//the diff seems to be time + (24 - 7), not time + 7 (the current tz offset) 
        	
        	var clickedDate = event.target.__data__.t;
        	console.log("heatmap timestamp clicked: " + clickedDate);
        	
        	//add tz adjustment (now working)
        	var tzOffset = new Date(clickedDate).getTimezoneOffset(); //offset in mins
    		var actualOffset = 24 - tzOffset/60
    		var tzAdjustment = actualOffset * 60 * 60 * 1000;
    		clickedDate = clickedDate + tzAdjustment;
        	
        	$scope.search.heatmap.clickedDateFormatted = new Date(clickedDate);
        	$scope.search.heatmap.clickedDate = clickedDate;
        	
        	//open dialog for heatmap day click
            //uncomment for popup dialog
            // ngDialog.open({
            // 	template: 'perDateStatsTemplate',
            // 	className: 'ngdialog-theme-default',
            // 	scope: $scope
            // });
            $scope.showHeatmapPerHour(event);
        }


        $scope.showHeatmapPerHour = function(event){
            console.log("showHeatmapPerHour() called");
            $scope.retrieveHeatmapForHour();
        }

        /*
        * Retrieves heatmap of spots for selected day for hour.
        */
        $scope.retrieveHeatmapForHour = function () {

            //set heatmap display back to false to force to redraw if there is data for range
            $scope.search.showDataDensityPerHour = false;

            //when using timepicker
            //var fromTimeOnly = moment($scope.search.fromTime).format("HH:mm:ss");
            //var toTimeOnly = moment($scope.search.toTime).format("HH:mm:ss");
            var fromTimeOnly = $scope.search.fromTime;
            var toTimeOnly = $scope.search.toTime;
            var formattedFromDate = moment($scope.search.fromDate).format("YYYY-MM-DD");
            var formattedToDate = moment($scope.search.toDate).format("YYYY-MM-DD");
            $scope.search.selectedStartDateTime = formattedFromDate + "T" + fromTimeOnly + "Z";
            $scope.search.selectedEndDateTime = formattedToDate + "T" + toTimeOnly + "Z";

            //build heatmap options
            url = process.env.API_URL + "/spotviz/spotdata/heatmapCounts/" + $scope.search.callsign
                + "/hour"
            //TODO: add date range
            + "?fromdate=" + $scope.search.selectedStartDateTime;
            //+ "&todate=" + $scope.search.selectedEndDateTime;

            //retrieve and parse heatmap counts
            //$http.get(url).success(function (heatmapData) {
            $http({
                method: 'GET',
                url: url
            }).then(function (response){
                var heatmapData = response.data;

                if (heatmapData == {}) {
                    $scope.search.showDataDensityHour = false;
                }
                else{
                    $scope.search.heatmap.perhourConfig = {};
                    $scope.search.heatmap.perhourConfig = {
                        domain: "day",
                        subDomain: "x_hour",
                        legend : [50,100,300,500],
                        rowLimit: 24,
                        range: 1, ////angular-cal-heatmap default: 3
                        start: $scope.search.heatmap.clickedDate
                        //start: new Date("2018-06-30T01:00:00.000Z")
                    }
                };

                //reformat data to expected format for Cal-HeatMap
                //TODO: can this processing be moved to the endpoint?
                var parser = function(data) {
                    var parsedData = {};
                    parsedData.display = {};
                    parsedData.lookup = {};
                    for (var i in data.heatmapCounts) {
                        var ts = data.heatmapCounts[i]._id; //test removing this: / 1000;
                        ts = ts / 1000; // change back to seconds for cal-heatmap expected format
                        parsedData.display[ts] = data.heatmapCounts[i].count;
                        parsedData.lookup[ts] = {
                            firstSpot:  data.heatmapCounts[i].firstSpot,
                            lastSpot: data.heatmapCounts[i].lastSpot,
                            count: data.heatmapCounts[i].count
                        };
                    }
                    return parsedData;
                };
                var parsedHeatmapData = parser(heatmapData);
                $scope.search.heatmap.perhourConfig.data = parsedHeatmapData.display;
                $scope.search.heatmap.perhourConfig.rawdata = parsedHeatmapData.lookup;

                //afterLoadData not supported by directive?
                //$scope.search.heatmap.config.afterLoadData = parser;

                //toggle flag for ng-if display
                $scope.search.showDataDensityPerHour = true;

            }, function (error){
                console.log(error);
                //TODO: msg is not currently displayed on page?
                $scope.msg = "Failed to retrieve heatmap data at this time. Try later?";
            });

        }



        //Start the playback
        $scope.start = function () {
            //if already running, do nothing
            if (runningCounter != null) {
                return;
            }
            else {
                $scope.playbackControls.state = "Running";
                $scope.playbackControls.intervalBoundaries = [];
                
                //calc difference in minutes: selectedEndDateTime - selectedStartDateTime
                var startMoment = moment.utc($scope.search.selectedStartDateTime);
                var endMoment = moment.utc($scope.search.selectedEndDateTime);
                var diff = moment.duration(endMoment.diff(startMoment));
                var totalMinutesInSelectedTimeRange = diff.asMinutes();
                $scope.search.debugMsg = "Minutes: " + totalMinutesInSelectedTimeRange;

                var numberOfIntervalsInSelectedRange =
                        Math.ceil(totalMinutesInSelectedTimeRange / $scope.playbackControls.timeInterval);
                $scope.search.debugMsg = $scope.search.debugMsg + " / intervals: " + numberOfIntervalsInSelectedRange;

                if (numberOfIntervalsInSelectedRange == 0) {
                    $scope.search.errorMsg = "Selected date range was not long enough to contain any intervals of "
                            + " length " + $scope.playbackControls.timeInterval + " minutes. Please pick a longer time period.";
                }
                else {
                    //calc array of interval start and end times between selected start and end
                    var tempIntervalCount = 0;
                    var currentIntervalStartDate = moment.utc(startMoment);
                    var currentIntervalStartDateLocal;
                    var currentIntervalEndDate = null;
                    var currentIntervalEndDateLocal = null;
                    $scope.playbackControls.iterations = numberOfIntervalsInSelectedRange;
                    while (tempIntervalCount < numberOfIntervalsInSelectedRange) {


                    	currentIntervalStartDate = moment.utc(currentIntervalStartDate)
                        .add($scope.playbackControls.timeInterval, 'minutes');

                    	//TODO: need to check time ranges are inclusive and we don't loose anything in a gap
                        currentIntervalEndDate = moment.utc(currentIntervalStartDate);
                        currentIntervalEndDate.add($scope.playbackControls.timeInterval, 'minutes');

                        $scope.playbackControls.intervalBoundaries[tempIntervalCount] = {
                            intervalStartDate: currentIntervalStartDate,
                            intervalStartDateLocal: moment(currentIntervalStartDate).local().format("YYYY-MM-DD HH:mm:ss"),
                            intervalEndDate: currentIntervalEndDate,
                            intervalEndDateLocal: moment(currentIntervalEndDate).local().format("YYYY-MM-DD HH:mm:ss")
                        };

                        tempIntervalCount++;
                    }

                    runningCounter = $interval(function () {
                        $scope.date = moment($scope.date).add($scope.playbackControls.timeInterval, 'minutes');
                        $scope.playbackControls.currentInterval = $scope.playbackControls.currentInterval + 1;

                        //add subset of spots to markers for display
                        createMarkersFromData($scope.search.spots, $scope.playbackControls.currentInterval, 
                        		$scope.playbackControls.intervalBoundaries);

                    }, 1000 * $scope.playbackControls.updateRate, $scope.playbackControls.iterations);
                }
            }
        }


        //Stops the current running playback
        $scope.pause = function () {
            if ($interval.cancel(runningCounter)) {
                $scope.playbackControls.state = "Paused";
                runningCounter = null;
            }

        }

        //Resets current running playback ready for playback from start
        $scope.reset = function () {
            $scope.cancel();
            $scope.playbackControls.currentValue = 1;
            $scope.playbackControls.currentInterval = 0;
        }

        //Cancels the current running playback
        $scope.cancel = function () {
            if ($interval.cancel(runningCounter)) {
                runningCounter = null;
            }

        }

        //Changes the length of time in each interval
        $scope.changeIntervalLength = function () {
            //TODO
        }


        //Changes the playback rate for the current running playback
        $scope.changeRate = function () {
            $scope.cancel();
            runningCounter = $interval(function () {
                $scope.date = moment($scope.date).add($scope.playbackControls.timeInterval, 'minutes');
            }, 1000 * $scope.playbackControls.updateRate, $scope.playbackControls.iterations);
        };

    }]);


spotVizControllers.controller('AboutController', function ($scope) {
});


spotVizControllers.controller('HomeController', function ($scope) {
});

// //create components
// spotVizControllers.component('historyPlaybackControls', {
//     template : historyPlaybackControlsTemplate,
//     bindings: { playbackControls: '=' }
// });
// spotVizControllers.component('visualizationPlayback', {
//     template : visualizationPlaybackTemplate
// });

//module.exports = spotVizControllers;