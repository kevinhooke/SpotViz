var spotVizControllers = angular.module('SpotVizControllers', []);

spotVizControllers.controller('SpotVizController', function($scope, $http) {
	
	//todo: ui-date docs: https://github.com/angular-ui/ui-date
	
	$scope.retrieve = function(){
		url = "/spotviz/spotdata/spots/" + $scope.callsign + "?fromdate="
			+ $scope.fromDate + "&todate=" + $scope.toDate;
		$scope.debugMsg = "url is:" + url;
		$http.get(url).success(
				function(data){
					if(data == ""){
						$scope.msg = "No data for callsign: " + $scope.callsign;
					}
					$scope.spots = data;
				}).error(function(data){
					$scope.msg = "Failed to retrieve data at this time. Try later?";
				});
	}
});


spotVizControllers.controller('AboutController', function($scope) {
});


spotVizControllers.controller('HomeController', function($scope) {
});

