var spotVizControllers = angular.module('SpotVizControllers', []);

spotVizControllers.controller('SpotVizController', function($scope, $http,
		uiGmapGoogleMapApi) {

	//toggle for showing map after form values submitted
	$scope.showMap = false;
	
    $scope.minuteStep = 15;
    $scope.markers = [];
    
    //default from and to date options
    $scope.fromDateOptions = null;
    $scope.toDateOptions = null;
    
	$scope.map = {
		//TODO: center map on spotter's QTH?
		center : {
			latitude : 39.8,
			longitude : -98.5
		},
		zoom : 4
	};
        
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
		url = "/spotviz/spotdata/spots/" + $scope.callsign + "?fromdate="
				+ $scope.fromDate + "T" + fromTimeOnly + "Z" + "&todate=" + $scope.toDate 
				+ "T" + toTimeOnly + "Z";
		
		
		$scope.debugMsg = "url is:" + url;
		$http.get(url).success(function(data) {
			if (data == {}) {
				$scope.msg = "No data for callsign: " + $scope.callsign;
				$scope.spots = "";
				$scope.markers = [];
			} else {
				$scope.msg = data.length + " spots for callsign: " + $scope.callsign;
				$scope.spots = data;

				// test: add marker
				$scope.markers = [];
				markerId = 0;
				for (var i=0; i< data.length; i++) {
					$scope.markers.push({
						id : i,
						latitude : data[i].spotDetail.latitude,
						longitude : data[i].spotDetail.longitude,
						title : data[i].word2
					});
				}
				$scope.showMap = true;
			}
		}).error(function(data) {
			$scope.msg = "Failed to retrieve data at this time. Try later?";
		});
	}

	uiGmapGoogleMapApi.then(function(maps) {
		// init here
	});
});

spotVizControllers.controller('AboutController', function($scope) {
});

spotVizControllers.controller('HomeController', function($scope) {
});
