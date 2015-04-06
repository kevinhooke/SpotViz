var spotVizControllers = angular.module('SpotVizControllers', []);

spotVizControllers.controller('SpotVizController', function($scope, $http,
		uiGmapGoogleMapApi) {

	$scope.map = {
		center : {
			latitude : 39.8,
			longitude : -98.5
		},
		zoom : 4
	};
	$scope.markers = [];

	$scope.retrieve = function() {
		url = "/spotviz/spotdata/spots/" + $scope.callsign + "?fromdate="
				+ $scope.fromDate + "&todate=" + $scope.toDate;
		$scope.debugMsg = "url is:" + url;
		$http.get(url).success(function(data) {
			if (data == "") {
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
