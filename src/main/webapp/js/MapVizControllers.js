var spotVizControllers = angular.module('SpotVizControllers', ["ngAnimate"]);

spotVizControllers.filter('spotIntervalFilter', function () {

    return function (data, interval, intervalBoundaries) {
        var filteredData = [];
        var boundary = intervalBoundaries[interval];
        //TODO if have index positions from a prior run, use those and do a slice
        //otherwise iterate through to find posts within the interval
        for (i = 0; i < data.length; i++) {
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

});

spotVizControllers.controller('SpotVizController', ['$scope', '$http', '$filter', '$interval',
    '$state',
    function ($scope, $http, $filter, $interval, $state) {

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

        //show data density display
        $scope.search.showDataDensity = false;

        //TODO what is this used for?
        $scope.search.date = moment();
        
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
                	$scope.playbackControls.noSpotsInIntervalMsg = "Spots in this interval: " + currentIntervalSpots.length;
                    $scope.playbackData.positions.push({
                        lat: currentIntervalSpots[i].spotDetail.latitude,
                        lng: currentIntervalSpots[i].spotDetail.longitude});
                }
            }
        }


        /*
         * Retrieves a summary of spots for the currently entered callsign. 
         */
        $scope.retrieveSpotSummaryForCallsign = function () {
            if (!angular.isUndefined($scope.search.callsign) && $scope.search.callsign != null) {
                url = "/spotviz/spotdata/spots/" + $scope.search.callsign;
                $http.get(url).success(function (data) {
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
                        $scope.search.dateFirstSpot = data.firstSpot.$date;
                        //$scope.fromDate = moment($scope.dateFirstSpot).format("mm/DD/YYYY").toDate();
                        $scope.search.fromDate = $scope.search.dateFirstSpot;

                        lastSpotDate = moment(data.lastSpot.$date).add(1, 'days').toDate();
                        $scope.search.toDate = lastSpotDate;
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
         * Retrieves spots for given callsign and date range.
         */
        $scope.retrieve = function () {
            var fromTimeOnly = moment($scope.search.fromTime).format("HH:mm:ss");
            var toTimeOnly = moment($scope.search.toTime).format("HH:mm:ss");
            var formattedFromDate = moment($scope.search.fromDate).format("YYYY-MM-DD");
            var formattedToDate = moment($scope.search.toDate).format("YYYY-MM-DD");
            $scope.search.selectedStartDateTime = formattedFromDate + "T" + fromTimeOnly + "Z";
            $scope.search.selectedEndDateTime = formattedToDate + "T" + toTimeOnly + "Z";


            url = "/spotviz/spotdata/spots/" + $scope.search.callsign
                    + "?fromdate=" + $scope.search.selectedStartDateTime
                    + "&todate=" + $scope.search.selectedEndDateTime;


            $scope.search.debugMsg = "url is:" + url;
            $http.get(url).success(function (data) {
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
                    
                    //heatmap
                    $scope.search.heatmap = {};
                    $scope.search.heatmap.config = {
                        domain: "month",
                        start: new Date(2015, 4, 1)
                    };
                    
                    $scope.search.showDataDensity = true;
                }
            }).error(function (data) {
                $scope.msg = "Failed to retrieve data at this time. Try later?";
            });
        }

        //
        //TODO: need to degub the playback, not working
        //
        
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
                    var currentIntervalEndDate = null;
                    $scope.playbackControls.iterations = numberOfIntervalsInSelectedRange;
                    while (tempIntervalCount < numberOfIntervalsInSelectedRange) {


                    	currentIntervalStartDate = moment.utc(currentIntervalStartDate)
                        .add($scope.playbackControls.timeInterval, 'minutes');

                    	//TODO: need to check time ranges are inclusive and we don't loose anything in a gap
                        currentIntervalEndDate = moment.utc(currentIntervalStartDate);
                        currentIntervalEndDate.add($scope.playbackControls.timeInterval, 'minutes');

                        $scope.playbackControls.intervalBoundaries[tempIntervalCount] = {
                            intervalStartDate: currentIntervalStartDate,
                            intervalEndDate: currentIntervalEndDate
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
