var spotDataControllers = angular.module('SpotDataControllers', ['ngMessages']);

spotDataControllers.controller('SpotDataController', ['$scope', '$http', '$filter', '$interval', '$state',
    function ($scope, $http, $filter, $interval, $state) {

	//model for search result data
    $scope.spotdata = {};
	
    //model for search form
    $scope.datasearch = {};
    
	//model for spot data search
	$scope.spotdataForCallsign = {};
    
	//initial page load
	$scope.init = function(){
		console.log("ctrl init");
		
		var url = "/spotviz/spotdata/topUploads";
//        $http.get(url).success(function (data) {
//            console.log('data: ' + data);
//            $scope.spotdata.data = data;
//        });
        
        $http({
            method: 'GET',
            url: url
         }).then(function (response){
        	 var data = response.data;
        	 console.log('data: ' + data);
             $scope.spotdata.data = data;
         }, function (error){

         });
	}
	
	$scope.retrieveSpotDataForCallsign = function(){
		var url = "/spotviz/spotdata/spots/" + $scope.datasearch.callsign;
		
//        $http.get(url).success(function (data) {
//            console.log('data: ' + data);
//            if(data._id){
//            	$scope.spotdataForCallsign.data = data;
//            	$scope.spotdataForCallsign.noDataMsg = "";
//            }
//            else{
//            	$scope.spotdataForCallsign.data = {};
//            	$scope.spotdataForCallsign.noDataMsg = "No data available for callsign: "
//            		+ $scope.datasearch.callsign;
//            }
//        });
        
        $http({
            method: 'GET',
            url: url
         }).then(function (response){
        	 var data = response.data;
        	 console.log('data: ' + data);
             if(data._id){
             	$scope.spotdataForCallsign.data = data;
             	$scope.spotdataForCallsign.noDataMsg = "";
             }
             else{
             	$scope.spotdataForCallsign.data = {};
             	$scope.spotdataForCallsign.noDataMsg = "No data available for callsign: "
             		+ $scope.datasearch.callsign;
             }
         }, function (error){

         });
	}

}]);