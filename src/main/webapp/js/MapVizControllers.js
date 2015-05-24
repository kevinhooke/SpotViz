var spotVizControllers = angular.module('SpotVizControllers', []);

spotVizControllers.filter('spotIntervalFilter', function(){
	
	return function(data, interval, intervalBoundaries){
		var filteredData = [];
		 var boundary = intervalBoundaries[interval];
		 //TODO if have index positions from a prior run, use those and do a slice
		 //otherwise iterate through to find posts within the interval
		 for(i=0; i < data.length; i++){
			 currentSpotDate = data[i].spotReceivedTimestamp.$date;
			 //if current date is after the last date for this interval, then skip the rest
			 if(moment.utc(currentSpotDate).isAfter(boundary.intervalEndDate)){
				 break;
			 }
			 else{
				 if(moment.utc(currentSpotDate).isAfter(boundary.intervalStartDate)
						 && moment.utc(currentSpotDate).isBefore(boundary.intervalEndDate)){
					 filteredData.push(data[i]);
				 }
			 }
		 }
		//filteredData = data.slice(boundary.intervalStartDate, boundary.intervalEndDate);
		return filteredData;
	}

});

spotVizControllers.controller('SpotVizController', ['$scope', '$http', '$filter', '$interval',
		function($scope, $http, $filter, $interval) {

	//toggle for showing map after form values submitted
	$scope.showMap = false;
	
	//selected start and end dates and times, combined
	$scope.selectedStartDateTime = null;
	$scope.selectedEndDateTime = null;
	
    $scope.minuteStep = 15;
    
    //default from and to date options for date pickers
    $scope.fromDateOptions = null;
    $scope.toDateOptions = null;
    
    //initial empty array for map marker positions
    $scope.positions = [];

    var runningCounter = null;
    $scope.debugMsg = null;
    $scope.iterations = 0; //number of times the interval runs, 0 = continuous
    $scope.date = moment();
    $scope.updateRate = 1; //number of seconds betweeb updates
    $scope.timeInterval = 30; //how many minutes the date advances on each iteration
    $scope.state = "Stopped";

    //progress bar
    $scope.maxValue=10;
    $scope.currentValue=1;
    $scope.currentInterval=0;
    
    
    /*
     * Creates array of markers from data
     */
    function createMarkersFromData(data, interval, intervalBoundaries){
    	
    	var currentIntervalSpots = $filter('spotIntervalFilter')(data, interval, intervalBoundaries);
    	//empty the array of positions
    	$scope.positions = [];
    	
    	markerId = 0;
		for (var i=0; i< currentIntervalSpots.length; i++) {

			$scope.positions.push({
				lat : currentIntervalSpots[i].spotDetail.latitude,
				lng : currentIntervalSpots[i].spotDetail.longitude});
		}
    }
    
    
	/*
	 * Retrieves a summary of spots for the currently entered callsign. 
	 */
	$scope.retrieveSpotSummaryForCallsign = function() {
		url = "/spotviz/spotdata/spots/" + $scope.callsign;
		$http.get(url).success(function(data) {
			console.log('data: ' + data )
			if (Object.keys(data) == 0 ) {
				$scope.msg = "Sorry, there's no spot data currently uploaded for callsign [" 
					+ $scope.callsign + "]. Click the link 'How to upload your spots' (TODO) for" +
							"instructions on how to upload your received spot data for visualzation.";
				
				$scope.numberOfSpots = 0;
				$scope.spots = "";
				$scope.markers = [];
			} else {
				//TODO: setting default from and to dates are not in expected format, but selecting from
				//picker is in correct format
				$scope.msg = '';
				$scope.numberOfSpots = data.totalSpots;
				$scope.dateFirstSpot = data.firstSpot.$date;
				//$scope.fromDate = moment($scope.dateFirstSpot).format("mm/DD/YYYY").toDate();
				$scope.fromDate = $scope.dateFirstSpot;

				//lastSpotDate = moment(data.lastSpot.$date).add(1, 'days').format("mm/DD/YYYY").toDate();
				lastSpotDate = moment(data.lastSpot.$date).add(1, 'days').toDate();
				$scope.toDate = lastSpotDate;
				$scope.fromDateOptions = {
					minDate: new Date(data.firstSpot.$date),
					maxDate: lastSpotDate
				};
				$scope.dateLastSpot = data.lastSpot.$date;
				
				$scope.toDateOptions = {
						minDate: new Date(data.firstSpot.$date),
						maxDate: lastSpotDate
					};
			}
			
		});
	}
	
	/*
	 * Retrieves spots for given callsign and date range.
	 */
	$scope.retrieve = function() {
		var fromTimeOnly = moment($scope.fromTime).format("HH:mm:ss");
		var toTimeOnly = moment($scope.toTime).format("HH:mm:ss");
		var formattedFromDate = moment($scope.fromDate).format("YYYY-MM-DD");
		var formattedToDate = moment($scope.toDate).format("YYYY-MM-DD");
		$scope.selectedStartDateTime = formattedFromDate + "T" + fromTimeOnly + "Z";
		$scope.selectedEndDateTime = formattedToDate + "T" + toTimeOnly + "Z";
		
		
		url = "/spotviz/spotdata/spots/" + $scope.callsign 
			+ "?fromdate=" + $scope.selectedStartDateTime 
			+ "&todate=" + $scope.selectedEndDateTime;
		
		
		$scope.debugMsg = "url is:" + url;
		$http.get(url).success(function(data) {
			if (data == {}) {
				$scope.msg = "No data for callsign: " + $scope.callsign;
				$scope.spots = "";
				$scope.markers = [];
			} else {
				$scope.msg = data.length + " spots for callsign: " + $scope.callsign;
				$scope.spots = data;
				$scope.showMapControls = true;
			}
		}).error(function(data) {
			$scope.msg = "Failed to retrieve data at this time. Try later?";
		});
	}

	//Start the playback
    $scope.start = function () {
        //if already running, do nothing
        if (runningCounter != null) {
            return;
        }
        else {
            $scope.state = "Running";
            var intervalBoundaries = [];
            
            //calc difference in minutes: selectedEndDateTime - selectedStartDateTime
            var startMoment = moment.utc($scope.selectedStartDateTime);
            var endMoment = moment.utc($scope.selectedEndDateTime);
            var diff = moment.duration(endMoment.diff(startMoment));
            var totalMinutesInSelectedTimeRange = diff.asMinutes();
            $scope.debugMsg = "Minutes: " + totalMinutesInSelectedTimeRange;
            
            // totalMinutesInSelectedTimeRange / $scope.timeInterval
            var numberOfIntervalsInSelectedRange = 
            	Math.ceil(totalMinutesInSelectedTimeRange / $scope.timeInterval);
            $scope.debugMsg = $scope.debugMsg + " / intervals: " + numberOfIntervalsInSelectedRange;
            
            if(numberOfIntervalsInSelectedRange == 0){
            	scope.errorMsg = "Selected date range was not long enough to contain any intervals of "
            		+ " length " + $scope.timeInterval + " minutes. Please pick a longer time period.";
            }
            else{            	
	            //calc array of interval start and end times between selected start and end
	            var tempIntervalCount = 0;
	            var currentIntervalStartDate = moment.utc(startMoment);
	        	var currentIntervalEndDate = null;
	        	$scope.iterations = numberOfIntervalsInSelectedRange;
	            while(tempIntervalCount < numberOfIntervalsInSelectedRange){
	            	//first time through tempIntervalCount=0 so no minutes are added to the start date
	            	//time operations modify the original value
	            	currentIntervalStartDate = moment.utc(currentIntervalStartDate).add((tempIntervalCount * $scope.timeInterval), 'minutes');
	            	//TODO: need to check time ranges are inclusive and we don't loose anything in a gap
	            	currentIntervalEndDate = moment.utc(currentIntervalStartDate);
	            	currentIntervalEndDate.add($scope.timeInterval, 'minutes');
	            	
	            	intervalBoundaries[tempIntervalCount] = {
	            			intervalStartDate : currentIntervalStartDate,
	            			intervalEndDate : currentIntervalEndDate
	            	};
	            	
	            	tempIntervalCount++;
	            }
	            
	            runningCounter = $interval(function () {
	                $scope.date = moment($scope.date).add($scope.timeInterval, 'minutes');
	                $scope.currentInterval = $scope.currentInterval + 1;
	                                
	                //add subset of spots to markers for display
					createMarkersFromData($scope.spots, $scope.currentInterval, intervalBoundaries);
			
	            }, 1000 * $scope.updateRate, $scope.iterations);
            }
        }
    }
	
	
	//Stops the current running playback
	$scope.stop = function () {
        if ($interval.cancel(runningCounter) ){
            $scope.state = "Stopped";
            runningCounter = null;
        }

    }

	//Cancels the current running playback
    $scope.cancel = function () {
        if ($interval.cancel(runningCounter)){
            runningCounter = null;
        }

    }

    //Changes the playback rate for the current running playback
    $scope.changeRate = function () {
        $scope.cancel();
        runningCounter = $interval(function () {
            $scope.date = moment($scope.date).add($scope.timeInterval, 'minutes');
        }, 1000 * $scope.updateRate, $scope.iterations);
    };

}]);


spotVizControllers.controller('AboutController', function($scope) {
});


spotVizControllers.controller('HomeController', function($scope) {
});
